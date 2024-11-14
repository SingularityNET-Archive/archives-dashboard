import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from "../../lib/supabaseClient";

interface DiscordRoles {
  // Add specific properties of your discord_roles object here
  // For example:
  [key: string]: unknown;  // This allows any key-value pairs in the object
}

interface User {
  discord_roles: DiscordRoles | null; 
  app_role: string;       
}

interface ResponseData {
  isAdmin: boolean;
  discordRoles: DiscordRoles | null;
  appRole: string | null;
}

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<ResponseData | { error: string }>
) {
  const { userId } = req.query;

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("discord_roles, app_role")
    .eq("user_id", userId);

  if (userError) {
    return res.status(500).json({ error: userError.message });
  }

  // Extract values from userData array
  let discordRoles: DiscordRoles | null = null;
  let appRole: string | null = null;
  let isAdmin = false;
  
  if (userData && Array.isArray(userData) && userData.length > 0) {
    discordRoles = (userData[0] as User).discord_roles;
    appRole = (userData[0] as User).app_role;
    isAdmin = appRole === "admin";
    console.log(userData);
  }

  return res.status(200).json({ isAdmin, discordRoles, appRole });
}