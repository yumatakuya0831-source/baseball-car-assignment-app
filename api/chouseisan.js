export default async function handler(request, response) {
  const targetUrl = request.query?.url;

  if (!targetUrl || typeof targetUrl !== "string") {
    response.status(400).json({ error: "url is required" });
    return;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
  } catch {
    response.status(400).json({ error: "invalid url" });
    return;
  }

  if (parsedUrl.hostname !== "chouseisan.com") {
    response.status(400).json({ error: "only chouseisan.com is allowed" });
    return;
  }

  try {
    const fetchResponse = await fetch(parsedUrl.toString(), {
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; BaseballCarAssignmentApp/1.0; +https://vercel.app)",
      },
    });

    if (!fetchResponse.ok) {
      response.status(fetchResponse.status).json({ error: "failed to fetch chouseisan" });
      return;
    }

    const html = await fetchResponse.text();
    response.setHeader("content-type", "text/html; charset=utf-8");
    response.status(200).send(html);
  } catch (error) {
    console.error("chouseisan api error:", error);
    response.status(500).json({ error: "internal error" });
  }
}
