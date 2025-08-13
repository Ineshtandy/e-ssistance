document.getElementById("email-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email_content = e.target.email_content.value;
  const query = e.target.user_query.value;
  const purpose = e.target.purpose.value;
  const intent = e.target.intent.value;
  const style = e.target.style.value;

  const res = await fetch("http://127.0.0.1:5000/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email_content, query, purpose, intent, style })
  });

  if (!res.ok) {
    document.getElementById("output").innerText = "Error contacting server";
    return;
  }

  const data = await res.json();
  document.getElementById("output").innerHTML = `
    <p><strong>Subject:</strong> ${data.subject}</p>
    <p><strong>Body:</strong><br>${data.body}</p>
  `;
});
