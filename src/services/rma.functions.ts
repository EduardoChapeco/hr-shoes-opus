import { createServerFn } from "@tanstack/react-start";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/identity";
import { insertAuditLog } from "./audit.functions";

export const getStoreRmaRequests = createServerFn({ method: "GET" }).handler(async () => {
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "support", "stock"]);

  const db = getServerClient();
  const { data, error } = await db
    .from("rma_requests")
    .select(`
      *,
      rma_items (*)
    `)
    .eq("store_id", identity.store_id)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Erro ao buscar RMAs: " + error.message);
  return data;
});

export const updateRmaStatus = createServerFn({ method: "POST" })
  .validator((d: { rmaId: string; status: string }) => d)
  .handler(async ({ data: { rmaId, status } }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager", "support"]);

    const db = getServerClient();
    const { error } = await db
      .from("rma_requests")
      .update({ status })
      .eq("id", rmaId)
      .eq("store_id", identity.store_id);

    if (error) throw new Error("Erro ao atualizar RMA: " + error.message);

    await insertAuditLog({
      store_id: identity.store_id,
      changed_by: identity.user_id,
      action: `RMA_STATUS_UPDATED_${status.toUpperCase()}`,
      table_name: "rma_requests",
      record_id: rmaId,
      metadata: { new_status: status },
    });

    return { success: true };
  });

export const requestRma = createServerFn({ method: "POST" })
  .validator(
    (d: {
      orderId: string;
      type: string;
      resolutionType: string;
      items: Array<{ variantId: string; quantity: number; reason: string; condition: string; photos?: any[] }>;
    }) => d
  )
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["customer"]);

    const db = getServerClient();
    
    // Create RMA Request
    const { data: rmaReq, error: reqErr } = await db
      .from("rma_requests")
      .insert({
        store_id: identity.store_id,
        customer_id: identity.user_id,
        order_id: data.orderId,
        type: data.type,
        resolution_type: data.resolutionType,
        status: "pending",
        shipping_responsibility: "store",
      })
      .select("id")
      .single();

    if (reqErr) throw new Error("Erro ao criar RMA: " + reqErr.message);

    // Create RMA Items
    const rmaItemsData = data.items.map((i) => ({
      rma_id: rmaReq.id,
      variant_id: i.variantId,
      quantity: i.quantity,
      reason: i.reason,
      condition: i.condition,
      photos_jsonb: i.photos || [],
    }));

    const { error: itemsErr } = await db.from("rma_items").insert(rmaItemsData);
    if (itemsErr) throw new Error("Erro ao adicionar itens ao RMA: " + itemsErr.message);

    return { success: true, rmaId: rmaReq.id };
  });
