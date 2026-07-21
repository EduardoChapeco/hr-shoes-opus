import { vi, beforeEach } from "vitest";

const createChainableMock = () => {
  const mock: any = vi.fn(() => mock);
  return new Proxy(mock, {
    get: (target, prop) => {
      if (prop === 'then') return undefined; 
      if (!(prop in target)) {
        target[prop] = createChainableMock();
      }
      return target[prop];
    }
  });
};

const mockIdentity = {
  id: "test-user-id",
  role: "admin",
  store_id: "test-store-id",
  organization_id: "test-org-id"
};

// These hoists will register the mock modules
vi.mock("@/lib/identity", () => ({
  getServerIdentity: vi.fn(),
  assertStoreAccess: vi.fn()
}));

vi.mock("@/lib/supabase-ssr.server", () => ({
  getSSRClient: vi.fn()
}));

vi.mock("@/lib/supabase", () => ({
  getServerClient: vi.fn(),
  SupabaseUnconfiguredError: class extends Error {},
}));

vi.mock("@/lib/tenant", () => ({
  resolveTenantStoreId: vi.fn()
}));

import { getServerIdentity } from "@/lib/identity";
import { getSSRClient } from "@/lib/supabase-ssr.server";
import { getServerClient } from "@/lib/supabase";
import { resolveTenantStoreId } from "@/lib/tenant";

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(getServerIdentity).mockResolvedValue(mockIdentity);
  vi.mocked(getSSRClient).mockReturnValue(createChainableMock());
  vi.mocked(getServerClient).mockReturnValue(createChainableMock());
  vi.mocked(resolveTenantStoreId).mockResolvedValue("test-store-id");
});
