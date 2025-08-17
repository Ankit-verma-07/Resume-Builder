async function searchGoogle(query) {
  // Your API Key and CX ID
  const apiKey = "AIzaSyAKvmI8SB4x3LV2MFtckXI5q0PqzhnaYQ4";
  const cx = "e07779dd46cf547d9";

  // Google Custom Search API URL with dateRestrict (last 30 days)
  const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${apiKey}&cx=${cx}&dateRestrict=d30`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.items) {
      data.items.forEach((item) => {
        console.log("Title:", item.title);
        console.log("Link:", item.link);
        console.log("Snippet:", item.snippet);
        console.log("-------------------------");
      });
    } else {
      console.log("No results found");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}


