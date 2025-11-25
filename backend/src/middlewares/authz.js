
import { supabase } from "../config/supabase.js";
export function requireOrgRole({ paramOrgId, orgModel, roles }) {
  return async (req, res, next) => {
    const orgId = req.params?.[paramOrgId] || req.body?.[paramOrgId] || req.query?.[paramOrgId];
    if (!orgId) return res.status(400).json({ error: "Missing organization id" });
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { data, error } = await supabase
      .from("memberships").select("id,role")
      .eq("user_id", userId).eq("org_model", orgModel).eq("org_id", orgId).in("role", roles).limit(1);
    if (error) return res.status(500).json({ error: error.message });
    if (!data || !data.length) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}
