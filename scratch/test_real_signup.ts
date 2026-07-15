import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL!;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function testSignupViaAdmin() {
  const admin = createClient(url, serviceKey);
  const supabase = createClient(url, anonKey);

  const testEmail = `hrshoes_forense_${Date.now()}@test.com`;
  const testPassword = 'TestPass123!';
  const testName = 'Usuário Teste Forense';

  console.log("=== TESTE DE CADASTRO VIA ADMIN API (bypass rate limit) ===");
  console.log("Email:", testEmail);
  console.log("");

  // Step 1: Create user via admin API (bypasses rate limit)
  console.log("PASSO 1: Criar usuário via admin.createUser...");
  const { data: userData, error: createErr } = await admin.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: { full_name: testName },
  });

  if (createErr) {
    console.error("❌ FALHA:", createErr.message);
    return;
  }
  console.log("✅ Usuário criado");
  console.log("  id:", userData.user.id);
  console.log("");

  // Step 2: Wait for trigger
  console.log("PASSO 2: Aguardando 2s para trigger handle_new_user...");
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 3: Check profile (service role bypasses RLS)
  console.log("PASSO 3: Verificando profile...");
  const { data: profile, error: profileErr } = await admin
    .from('profiles')
    .select('*')
    .eq('id', userData.user.id)
    .single();

  if (profileErr) {
    console.error("❌ Profile NÃO criado:", profileErr.message);
    console.error("   ⚠️ TRIGGER handle_new_user FALHOU ou NÃO EXISTE");
  } else {
    console.log("✅ Profile criado:");
    console.log("  role:", profile.role);
    console.log("  full_name:", profile.full_name);
    console.log("  organization_id:", profile.organization_id);
    console.log("  store_id:", profile.store_id);
    
    const expectedRole = 'owner'; // First user should be owner
    if (profile.role === expectedRole) {
      console.log(`  ✅ Role correta: ${profile.role} (primeiro usuário = owner)`);
    } else {
      console.log(`  ⚠️ Role inesperada: ${profile.role} (esperado: ${expectedRole})`);
    }
  }

  // Step 4: Login test
  console.log("\nPASSO 4: Testando login com signInWithPassword...");
  const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (loginErr) {
    console.error("❌ Login falhou:", loginErr.message);
  } else {
    console.log("✅ Login OK");
    console.log("  access_token:", loginData.session?.access_token ? "PRESENTE (" + loginData.session.access_token.substring(0, 20) + "...)" : "AUSENTE");
  }

  // Step 5: RLS test — read own profile
  if (loginData?.session) {
    console.log("\nPASSO 5: RLS — lendo próprio profile...");
    const authClient = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${loginData.session.access_token}` } },
    });
    const { data: myProfile, error: rlsErr } = await authClient
      .from('profiles')
      .select('*')
      .eq('id', loginData.user!.id)
      .single();

    if (rlsErr) {
      console.error("❌ RLS bloqueou:", rlsErr.message);
    } else {
      console.log("✅ RLS OK — perfil lido com sucesso");
      console.log("  role:", myProfile.role);
      console.log("  full_name:", myProfile.full_name);
    }

    // Step 6: RLS negative test — try to read all profiles
    console.log("\nPASSO 6: RLS NEGATIVO — tentando ler TODOS os profiles...");
    const { data: allProfiles } = await authClient.from('profiles').select('*');
    console.log(`  Profiles visíveis: ${allProfiles?.length ?? 0}`);
    if ((allProfiles?.length ?? 0) <= 1) {
      console.log("  ✅ RLS OK — usuário só vê o próprio perfil");
    } else {
      console.log("  ⚠️ RLS VAZAMENTO — usuário vê mais perfis do que deveria");
    }
  }

  // Cleanup
  console.log("\nPASSO 7: Limpando...");
  await admin.from('profiles').delete().eq('id', userData.user.id);
  await admin.auth.admin.deleteUser(userData.user.id);
  console.log("✅ Teste limpo");

  console.log("\n=== FIM ===");
}

testSignupViaAdmin().catch(console.error);
