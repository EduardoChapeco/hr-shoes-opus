const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '../.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TARGET_URL = 'http://localhost:8081';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const correlationId = Math.random().toString(36).substring(2, 10).toUpperCase();
const testEmail = `test.forensics.${correlationId}@example.com`;
const testPassword = 'Password123';

const logOutput = [];
function log(msg) {
  console.log(msg);
  logOutput.push(msg);
}

async function runTests() {
  log(`--- INICIANDO TESTE FORENSE [ID: ${correlationId}] ---`);
  log(`Alvo: ${TARGET_URL}`);
  log(`Email de teste: ${testEmail}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  let rpcHeaders = null;
  let rpcStatus = null;
  let rpcResponse = null;
  let rpcUrl = null;

  let allRequests = [];
  page.on('request', req => allRequests.push(req.url()));

  page.on('response', async (response) => {
    const url = response.url();
    // Catch RPC server function responses. They usually have _serverFnId in the query or similar.
    if (url.includes('_server') || url.includes('/api/') || (response.request().method() === 'POST' && url.includes(TARGET_URL))) {
      rpcUrl = url;
      rpcStatus = response.status();
      rpcHeaders = await response.allHeaders();
      try {
         rpcResponse = await response.json();
      } catch {
         rpcResponse = await response.text();
      }
    }
  });

  try {
    // ---------------------------------------------------------
    // 1. CADASTRO REAL
    // ---------------------------------------------------------
    log('\n[TESTE 1] CADASTRO REAL');
    await page.goto(`${TARGET_URL}/cadastro`);
    await page.waitForTimeout(3000);
    await page.fill('input[name="fullName"]', 'Test User Forensics');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    
    rpcHeaders = null; rpcStatus = null; rpcResponse = null; rpcUrl = null;
    allRequests = [];
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000); // just wait 5s for the RPC to complete instead of waiting for a specific URL

    log(`POST DE CADASTRO: ${rpcUrl}`);
    log(`TODAS AS REQUISIÇÕES FEITAS: ${JSON.stringify(allRequests, null, 2)}`);
    log(`STATUS HTTP: ${rpcStatus}`);
    log(`RESPONSE: ${JSON.stringify(rpcResponse)}`);
    log(`HEADERS NO SERVIDOR (Set-Cookie presente?): ${!!rpcHeaders?.['set-cookie']}`);
    if (rpcHeaders?.['set-cookie']) {
       log(`Set-Cookie gerado: ${rpcHeaders['set-cookie'].replace(/([a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)/g, '[REDACTED_JWT]')}`);
    }

    const cookiesCadastro = await context.cookies();
    log(`COOKIES NO NAVEGADOR APÓS CADASTRO:`);
    cookiesCadastro.forEach(c => log(`- Nome: ${c.name}, Domain: ${c.domain}, HttpOnly: ${c.httpOnly}, Secure: ${c.secure}, Path: ${c.path}`));
    
    // Check Supabase DB directly
    const { data: users, error: errU } = await supabase.auth.admin.listUsers();
    const createdUser = users?.users.find(u => u.email === testEmail);
    log(`REGISTRO EM auth.users: ${createdUser ? 'Encontrado' : 'Não Encontrado'} (ID: ${createdUser?.id})`);

    if (createdUser) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', createdUser.id).single();
      log(`REGISTRO EM profiles: ${profile ? 'Encontrado' : 'Não Encontrado'} (Role: ${profile?.role})`);
    }

    // ---------------------------------------------------------
    // 2. LOGIN REAL
    // ---------------------------------------------------------
    log('\n[TESTE 2] LOGIN REAL');
    
    if (createdUser && !createdUser.email_confirmed_at) {
       log('Aviso: Email confirmation is required by Supabase. Confirming artificially via admin API...');
       await supabase.auth.admin.updateUserById(createdUser.id, { email_confirm: true });
    }

    await context.clearCookies();
    
    await page.goto(`${TARGET_URL}/entrar`);
    await page.waitForTimeout(3000);
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);

    rpcHeaders = null; rpcStatus = null; rpcResponse = null; rpcUrl = null;
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    await page.waitForTimeout(2000);

    log(`POST DE LOGIN: ${rpcUrl}`);
    log(`STATUS HTTP: ${rpcStatus}`);
    log(`RESPONSE: ${JSON.stringify(rpcResponse)}`);
    log(`HEADERS NO SERVIDOR (Set-Cookie presente?): ${!!rpcHeaders?.['set-cookie']}`);
    if (rpcHeaders?.['set-cookie']) {
       log(`Set-Cookie gerado: ${rpcHeaders['set-cookie'].replace(/([a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)/g, '[REDACTED_JWT]')}`);
    }

    const cookiesLogin = await context.cookies();
    log(`COOKIES NO NAVEGADOR APÓS LOGIN:`);
    cookiesLogin.forEach(c => log(`- Nome: ${c.name}, Domain: ${c.domain}, HttpOnly: ${c.httpOnly}, Secure: ${c.secure}, Path: ${c.path}`));

    log(`ROTA APÓS REDIRECT: ${page.url()}`);

    // ---------------------------------------------------------
    // 3. RELOAD E ROTAS PROTEGIDAS
    // ---------------------------------------------------------
    log('\n[TESTE 3] RELOAD E ESTADO');
    await page.reload();
    await page.waitForTimeout(2000);
    log(`ESTADO APÓS RELOAD: URL atual -> ${page.url()}`);
    const cookiesReload = await context.cookies();
    const hasAuthCookie = cookiesReload.some(c => c.name.startsWith('sb-'));
    log(`Sessão sobreviveu ao reload? ${hasAuthCookie ? 'Sim' : 'Não'}`);

    // ---------------------------------------------------------
    // 4. LOGOUT
    // ---------------------------------------------------------
    log('\n[TESTE 4] LOGOUT');
    await page.goto(`${TARGET_URL}/conta`);
    await page.waitForTimeout(3000);
    
    const logoutBtn = await page.$('button:has-text("Sair"), a:has-text("Sair")');
    if (logoutBtn) {
       rpcHeaders = null; rpcStatus = null; rpcResponse = null; rpcUrl = null;
       await logoutBtn.click();
       await page.waitForTimeout(5000);
       await page.waitForTimeout(2000);
       log(`POST DE LOGOUT: ${rpcUrl}`);
       log(`STATUS HTTP: ${rpcStatus}`);
       log(`RESPONSE: ${JSON.stringify(rpcResponse)}`);
       
       const cookiesLogout = await context.cookies();
       const authCookiesExist = cookiesLogout.some(c => c.name.startsWith('sb-'));
       log(`COOKIES APÓS LOGOUT (Auth Presente?): ${authCookiesExist}`);
       log(`ROTA APÓS LOGOUT: ${page.url()}`);
    } else {
       log(`ERRO: Botão de Sair não encontrado na página ${page.url()}`);
    }
    
    await page.goto(`${TARGET_URL}/conta`);
    await page.waitForTimeout(2000);
    log(`ROTA APÓS TENTATIVA DE ACESSO PROTEGIDO: ${page.url()} (Esperado: /entrar ou /login)`);

  } catch (error) {
    log(`ERRO FATAL NO SCRIPT FORENSE: ${error.message}`);
  } finally {
    await browser.close();
    fs.writeFileSync('forensics_report.log', logOutput.join('\n'));
    log('Relatório salvo em forensics_report.log');
  }
}

runTests();
