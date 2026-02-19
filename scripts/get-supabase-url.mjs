const postgresUrl = process.env.POSTGRES_URL;

if (!postgresUrl) {
  console.log("POSTGRES_URL is missing");
} else {
  try {
    // POSTGRES_URL format: postgres://user:password@host:port/db
    // Host formats:
    // db.project-id.supabase.co
    // aws-0-region.pooler.supabase.com (doesn't have project id directly usually, but maybe user is part of it)
    
    const url = new URL(postgresUrl);
    const host = url.hostname;
    console.log("Host:", host);
    
    if (host.includes("supabase.co")) {
      const parts = host.split(".");
      if (parts[0] === "db") {
        const projectId = parts[1];
        console.log(`Found Project ID: ${projectId}`);
        console.log(`Supabase URL: https://${projectId}.supabase.co`);
      }
    } else if (host.includes("supabase.com")) {
       console.log("Using pooler URL, cannot extract project ID easily.");
    }
  } catch (e) {
    console.log("Error parsing URL:", e.message);
  }
}
