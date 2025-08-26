async function loadEmailGenerator() {
  // Prevent double injection
  if (document.getElementById("email-generator")) return;

  // Load index HTML
  const res = await fetch(chrome.runtime.getURL("inject/index.html"));
  const html = await res.text();

  // Create wrapper and inject HTML
  let wrapper = document.createElement("div");
  wrapper.id = 'index-page';
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);

  // Load CSS
  if (!document.querySelector('link[index-style="1"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('inject/style.css');
    link.setAttribute('index-style', '1');
    document.head.appendChild(link);
  }

  // Backend URL (match the port in `docker compose ps`)
  const BACKEND_URL = "http://127.0.0.1:5050";

  // tab injection in wrapper
  document.querySelectorAll('.index-tab').forEach(btn => {
    btn.addEventListener('click', async () => {
      label = btn.textContent.trim()

      if (label === 'Email Generator') {
        wrapper.remove();

        // getting html
        const url = chrome.runtime.getURL("inject/email_writer.html")
        try {
          const res = await fetch(url);
          const form_ui_html = await res.text();

          // appending html
          wrapper = document.createElement('div')
          wrapper.id = 'email-form'
          wrapper.innerHTML = form_ui_html
          document.body.appendChild(wrapper)

          // appending css
          if (!document.querySelector('link[email-gen-form-style="1"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = chrome.runtime.getURL('inject/email_writer.css');
            link.setAttribute('email-gen-form-style', '1');
            document.head.appendChild(link);
          }
        }
        catch (err) {
          console.error(url,err);
          alert('could not load email generator ui. check console for details')
        }
      }

      if (label === 'Summary Generator') {
        wrapper.remove();

        const url = chrome.runtime.getURL("inject/summary_generator.html")
        try {
          const res = await fetch(url);
          const sum_gen_html = await res.text();

          // appending html
          wrapper = document.createElement('div')
          wrapper.id = 'sum-gen'
          wrapper.innerHTML = sum_gen_html
          document.body.appendChild(wrapper)

          // appending css
          if (!document.querySelector('link[sum-gen-form-style="1"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = chrome.runtime.getURL('inject/summary_generator.css');
            link.setAttribute('sum-gen-form-style', '1');
            document.head.appendChild(link);
          }
        }
        catch (err) {
          console.error(url,err);
          alert('could not load summary generator ui. check console for details')
        }
      }
    });
  });

  // range logic for summary generator
  // delegating
  document.addEventListener('change', async (e) => {
    const sum_gen_root = e.target.closest('#summary-generator')

    if (sum_gen_root && e.target.name === 'range_mode') {
      const dateWrap = sum_gen_root.querySelector('.date-range');
      const start_date = sum_gen_root.querySelector('#start_date');
      const end_date = sum_gen_root.querySelector('#end_date');

      const custom = e.target.value === 'custom';

      start_date.disabled = !custom;
      end_date.disabled = !custom;

      const today = new Date().toISOString().split('T')[0];
      start_date.max = today;
      end_date.max   = today;

      if (!custom) {
        // Clear dates when switching back to "Past 24 hours"
        start_date.value = '';
        end_date.value   = '';
        end_date.min     = '';
        return;
      }

      start_date.addEventListener('change', () => {
        end_date.max = start_date.value || '';
        if (end_date.value && end_date.value < end_date.min) {
          end_date.value = '';
        }
      }, { once: true });

      dateWrap.setAttribute('aria-hidden', String(!custom));
    }
  })
  

  // event delegation on wrapper not working, since wrapper.remove() changes the wrapper on which listener is attached
  // adding delegation on docuement and filtering caller
  document.addEventListener('submit', async (e) => {
    let form = e.target.closest('#email-form');
    if (form) {
      e.preventDefault();

      const email_content = e.target.email_content.value;
      const query = e.target.user_query.value;
      const purpose = e.target.purpose.value;
      const intent = e.target.intent.value;
      const style = e.target.style.value;

      const res = await fetch(`${BACKEND_URL}/`, {
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
    }

    summary_form = document.getElementById('summary-form');
    if (summary_form) {
      e.preventDefault();
      
      const panel = summary_form.closest('#summary-generator');
      const mode  = panel.querySelector('input[name="range_mode"]:checked')?.value;

      const startInput = panel.querySelector('#start_date');
      const endInput   = panel.querySelector('#end_date');
      const today = new Date().toISOString().split('T')[0];

      let payload;

      if (mode === 'custom') {
        const start = startInput.value;
        const end   = endInput.value;

        // Basic validations
        if (!start || !end) {
          alert('Please select both start and end dates.');
          return;
        }
        if (start > today) {
          alert('Start date cannot be in the future.');
          return;
        }
        if (end > today) {
          alert('End date cannot be in the future.');
          return;
        }
        if (end >= start) {
          alert('End date cannot be after or start date.');
          return;
        }
        payload = { mode: 'custom', start_date: start, end_date: end };
      } else {
        payload = { mode: 'last24' };
      }

      // TODO: POST to backend, then render summary
      const output = panel.querySelector('#output');
      output.textContent = `Generating summary for: ${JSON.stringify(payload)}`;
      // const res = await fetch(...)

      return;
    }
  }, true);

  // event delegation for close button
  // makes sure the close button works for all rendered ui (changes with every ui)
  document.addEventListener('click', (e) => {
    let btn = e.target.closest('#close-button');
    if (btn){
      // event delegation
      // decide which container to remove (the current view or the whole panel)
      const panel = document.getElementById('email-form') 
                || document.getElementById('index-page')
                || document.getElementById('summary-generator');

      panel?.remove();
    }

    btn = e.target.closest('#back-button');
    if (btn) {
      e.preventDefault();
      alert('back working');

      // // Load index HTML
      // const res = fetch(chrome.runtime.getURL("inject/index.html"));
      // const html = res.text();

      // // Create wrapper and inject HTML
      // let wrapper = document.createElement("div");
      // wrapper.id = 'index-page';
      // wrapper.innerHTML = html;
      // document.body.appendChild(wrapper);

      // // Load CSS
      // if (!document.querySelector('link[index-style="1"]')) {
      //   const link = document.createElement('link');
      //   link.rel = 'stylesheet';
      //   link.href = chrome.runtime.getURL('inject/style.css');
      //   link.setAttribute('index-style', '1');
      //   document.head.appendChild(link);
      // }
    }
  });
}

loadEmailGenerator();