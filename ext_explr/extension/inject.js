// import './inject/ui.js';
// // Prevent multiple instances
// if (!document.getElementById('email-generator-container')) {
//   const container = document.createElement('div');
//   container.id = 'email-generator-container';
//   container.style.position = 'fixed';
//   container.style.top = '10px';
//   container.style.right = '10px';
//   container.style.zIndex = 999999;
//   container.style.width = '300px';
//   container.style.background = '#fff';
//   container.style.border = '1px solid #ccc';
//   container.style.padding = '1rem';
//   container.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
//   container.style.borderRadius = '8px';
//   container.innerHTML = `
//     <h3>Generate a Professional Email</h3>
//     <form method="POST" id="email-form">
//         <label>Email Content (Optional):</label><br>
//         <input type="text" name="email_content" value=""><br><br>

//         <label>User Query:</label><br>
//         <input type="text" name="user_query" value="write an email to thank my manager"><br><br>

//         <label>Purpose:</label><br>
//         <input type="text" name="purpose" value="writing"><br><br>

//         <label>Intent:</label><br>
//         <input type="text" name="intent" value="thanking"><br><br>

//         <label>Style:</label><br>
//         <input type="text" name="style" value="professional"><br><br>

//         <input type="submit" value="Generate Email">
//     </form>
//     <div id="output"></div>
//   `;

//   document.body.appendChild(container);

//   document.getElementById("email-form").addEventListener("submit", async (e) => {
//     e.preventDefault();

//     const email_content = e.target.email_content.value;
//     const query = e.target.user_query.value;
//     const purpose = e.target.purpose.value;
//     const intent = e.target.intent.value;
//     const style = e.target.style.value;

//     const res = await fetch("http://127.0.0.1:5000/", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email_content, query, purpose, intent, style })
//     });

//     if (!res.ok) {
//         document.getElementById("output").innerText = "Error contacting server";
//         return;
//     }

//     const data = await res.json();
//     document.getElementById("output").innerHTML = `
//         <p><strong>Subject:</strong> ${data.subject}</p>
//         <p><strong>Body:</strong><br>${data.body}</p>
//     `;
//     });
// }


async function loadEmailGenerator() {
  // Prevent double injection
  if (document.getElementById("email-generator")) return;

  // Load HTML from local file
//   alert('coming here')
  const res = await fetch(chrome.runtime.getURL("inject/index.html"));
//   alert('coming here?')
  const html = await res.text();

  // Create wrapper and inject HTML
  const wrapper = document.createElement("div");
  wrapper.id = 'email-generator';
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);

  // Load CSS
  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = chrome.runtime.getURL("inject/style.css");
  document.head.appendChild(style);

  // Wire button event
  document.getElementById("email-form").addEventListener("submit", async (e) => {
    e.preventDefault()

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

    // const query = document.getElementById("query").value;
    // const res = await fetch("http://127.0.0.1:5000/", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     query,
    //     purpose: "writing",
    //     intent: "thanking",
    //     style: "professional"
    //   })
    // });
    // const data = await res.json();
    // document.getElementById("output").innerHTML = `
    //   <strong>Subject:</strong><br>${data.subject}<br><br>
    //   <strong>Body:</strong><br>${data.body}
    // `;
  });

  document.getElementById("close-button").addEventListener("click", () => {
    wrapper.remove();
  });
}

loadEmailGenerator();