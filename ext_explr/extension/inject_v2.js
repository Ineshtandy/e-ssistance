// every time the extension is opened: background.js runs in background and executes this script

if (!window.__ext_bootstrapped__) {
    window.__ext_bootstrapped__ = true;
    boot();
}

window.BACKEND_URL = "http://127.0.0.1:5050";

async function boot() {
  let wrapper = document.createElement('div');
  wrapper.id = 'parent-div';
  document.body.appendChild(wrapper);

  wrapper.addEventListener('click',clickDelegator);
  wrapper.addEventListener('change',radioDelegator);
  wrapper.addEventListener('submit',submissionDelegator);

  wrapper.innerHTML = await fetchContent('inject/index.html')
  ensureCSS('inject/style.css','index-style')
}

// html and css loading functions:
// loads css
function ensureCSS(path, marker) {
  const sel = `link[data-${marker}="1"]`;
  if (document.querySelector(sel)) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL(path);
  link.setAttribute(`data-${marker}`, '1');
  (document.head || document.documentElement).appendChild(link);
}

// fetches html
async function fetchContent(relPath) {
  const url = await chrome.runtime.getURL(relPath);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.text();
}

async function swapView(wrapper,content,style,marker) {
    ensureCSS(style,marker);
    wrapper.innerHTML = await fetchContent(content);
}

// event listening functions:
// listens to button clicks
async function clickDelegator(e) {
    // Ignore radio button clicks, let radioDelegator handle them
    if (e.target.type === 'radio') return;

    if (
        e.target.closest('#close-button') ||
        e.target.closest('#back-button') ||
        e.target.closest('.index-tab')
    ) {
        e.preventDefault();
    }

    wrapper = e.currentTarget;

    if (e.target.closest('#close-button')) {
        // e.currentTarget.remove(); // remove wrapper
        window.__ext_bootstrapped__ = false;
        wrapper.remove()
        return;
    }

    if (e.target.closest('#back-button')) {
        e.preventDefault();

        fetchContent('inject/index.html').then(html => {
            wrapper.innerHTML = html;
            wrapper.style.display = '';
            ensureCSS('inject/style.css','index-style');
        });

        return;
    }

    const tab = e.target.closest('.index-tab');
    if (tab && tab.dataset.view === 'email_gen') {
        swapView(e.currentTarget, 'inject/email_writer.html', 'inject/email_writer.css', 'email-style');
    }
    if (tab && tab.dataset.view === 'summary') {
        swapView(e.currentTarget, 'inject/summary_generator.html', 'inject/summary_generator.css', 'summary-style');
    }
    if (tab && tab.dataset.view === 'application_helper') {
        swapView(e.currentTarget, 'inject/application_helper.html', 'inject/application_helper.css', 'application-helper-style');
    }

    return;
}

function radioDelegator(e) {
    // summary generator logic
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

      dateWrap.setAttribute('aria-hidden', String(!custom));
    }

    // application helper logic
    // const app_helper_root = e.target.closest('#application-helper')

    // if (app_helper_root && e.target.name === 'resume_input') {
    //     const resume = app_helper_root.querySelector('#resume');
    //     if (resume) {
    //         resume_file = resume.files[0];
    //         console.log(resume_file.name);
    //     }
    // }
    // return;
}

async function submissionDelegator(e) {
    e.preventDefault();

    const emailForm = e.target.closest('#email-form');
    if (emailForm) {
        e.preventDefault();
        showBlurOverlay();

        const email_content = e.target.email_content.value;
        const query = e.target.user_query.value;
        const purpose = e.target.purpose.value;
        const intent = e.target.intent.value;
        const style = e.target.style.value;

        let res;
        try {
                res = await fetch(`${BACKEND_URL}/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email_content, query, purpose, intent, style })
            });
        }
        catch (err) {
            document.getElementById("output").innerText = "Error contacting server";
            return;
        }

        hideBlurOverlay();

        const data = await res.json();
        document.getElementById("output").innerHTML = `
            <p><strong>Subject:</strong> ${data.subject}</p>
            <p><strong>Body:</strong><br>${data.body}</p>
        `;

        return;
    }

    const summaryForm = e.target.closest('#summary-form');
    if (summaryForm) {
        e.preventDefault();
        showBlurOverlay();

        const panel = summaryForm.closest('#summary-generator');
        const mode  = panel.querySelector('input[name="range_mode"]:checked')?.value;

        let cur_day;
        let start_date;
        let end_date;

        if (mode === 'custom') {
            const startInput = panel.querySelector('#start_date');
            const endInput   = panel.querySelector('#end_date');
            const today = new Date().toISOString().split('T')[0];

            const start = startInput.value;
            const end   = endInput.value;

            console.log('inside custom',start,end);

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
            if (end <= start) {
            alert('End date cannot be before start date.');
            return;
            }
            cur_day = false;
            start_date = start;
            end_date = end;
        } else {
            cur_day = true;
        }

        let res;
        try {
                res = await fetch(`${BACKEND_URL}/emsummary`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ cur_day, start_date, end_date })
                });
        }
        catch (err) {
            hideBlurOverlay();
            document.getElementById("output").innerText = "Error contacting server";
            return;
        }

        hideBlurOverlay();

        let data = null;
        try { data = await res.json(); } catch { /* leave data = null */ }

        if (!res.ok || !data || typeof data.summary !== 'string') {
        const msg = (data && data.error) ? data.error : `HTTP ${res.status}`;
        document.getElementById("output").innerHTML = `
            <p><strong>Requested Summary:</strong></p><br>
            <p>⚠️ ${msg}</p>
        `;
        console.log('Server error payload:', data);
        return;
        }

        document.getElementById("output").innerHTML = `
        <p><strong>Requested Summary:</strong></p><br>
        <p>${data.summary}</p>
        `;
    }

    const applicationForm = e.target.closest('#application-form');
    if (applicationForm) {
        e.preventDefault();
        showBlurOverlay();

        let app_form_element = document.querySelector('#application-form');
        app_form_data = new FormData(app_form_element);

        let res;
        // try {
            //     res = await fetch(`${BACKEND_URL}/apphelper`, {
            //     method: "POST",
            //     body: app_form_data
            // });
        // }
        // catch (err) {
        //     hideBlurOverlay();
        //     document.getElementById("output").innerText = "Error contacting server";
        //     return;
        // }

        try {
            res = await fetch(`${BACKEND_URL}/apphelper`, {
                method: "POST",
                body: app_form_data
            });

            const data = await res.json();
            const user_query = data.user_query || '';
            const context = data.context_info || 'here lies context';
            const profile = data.resume_content || 'here lies profile';

            const chatURL =
            `http://localhost:3000/` +
            `?user_query=${encodeURIComponent(user_query)}` +
            `&context=${encodeURIComponent(context)}` +
            `&profile=${encodeURIComponent(profile)}`;
            
            const output = document.getElementById('output');

            // Measure before changing content
            const bbox = output.getBoundingClientRect();
            const lockedHeight = Math.max( Math.round(bbox.height), 360 ); // fallback minimum

            // Prepare the host
            output.innerHTML = '';
            output.style.position = 'relative';
            output.style.height = lockedHeight + 'px';  // keep the same height as before
            output.style.overflow = 'hidden';

            // Add the iframe
            const iframe = document.createElement('iframe');
            iframe.src = chatURL;
            iframe.style.position = 'absolute';
            iframe.style.inset = '0';
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = '0';
            iframe.setAttribute('title', 'Chatbot');
            output.appendChild(iframe);

            // optional: hide the submit button
            const submitBtn = document.querySelector('#application-form [type="submit"]');
            if (submitBtn) submitBtn.style.display = 'none';


            // applicationForm.style.display = 'none';

            // (Optional) Scroll page to top so chat is fully visible
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error(err);
            document.getElementById('output').innerText = 'Error rendering chatbot';
        } finally {
            hideBlurOverlay();
        }

        // const data = await res.json();
        // document.getElementById("output").innerHTML = `
        //     <p><strong>Answer:</strong><br>${data.body}</p>
        // `;
    }
}

// function showBlurOverlay(message = "Fetching details...") {
//     // Blur the main panel
//     const panel = document.querySelector('#email-generator, #summary-generator');
//     if (panel) {
//         panel.style.filter = 'blur(2px)';

//         let overlay = panel.querySelector('.ext-blur-overlay');
//         if (!overlay) {
//             overlay = document.createElement('div');
//             overlay.className = 'ext-blur-overlay';
//             overlay.style.position = 'absolute';
//             overlay.style.top = 0;
//             overlay.style.left = 0;
//             overlay.style.width = '100%';
//             overlay.style.height = '100%';
//             overlay.style.display = 'flex';
//             overlay.style.alignItems = 'center';
//             overlay.style.justifyContent = 'center';
//             overlay.style.background = 'transparent';
//             overlay.style.zIndex = 1000;
//             overlay.style.pointerEvents = 'none';
//             overlay.style.fontSize = '1.2rem';
//             overlay.style.fontWeight = '600';
//             overlay.style.color = '#222';
//             // Ensure panel is positioned
//             if (getComputedStyle(panel).position === 'static') {
//                 panel.style.position = 'relative';
//             }
//             panel.appendChild(overlay);
//         }
//         overlay.textContent = message;
//         overlay.style.display = 'flex';
//     }    
// }

// function hideBlurOverlay() {
//     const panel = document.querySelector('#email-generator, #summary-generator');
//     if (panel) {
//         panel.style.filter = '';
//         const overlay = panel.querySelector('.ext-blur-overlay');
//         if (overlay) overlay.style.display = 'none';
//     }
// }

function showBlurOverlay(message = "Fetching details...") {
    const panel = document.querySelector('#email-generator, #summary-generator, #application-helper');
    if (panel) {
        // Wrap panel content if not already wrapped
        let blurWrap = panel.querySelector('.ext-blur-wrap');
        if (!blurWrap) {
            blurWrap = document.createElement('div');
            blurWrap.className = 'ext-blur-wrap';
            // Move all children into blurWrap
            while (panel.firstChild) {
                blurWrap.appendChild(panel.firstChild);
            }
            panel.appendChild(blurWrap);
        }
        blurWrap.style.filter = 'blur(2px)';

        let overlay = panel.querySelector('.ext-blur-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'ext-blur-overlay';
            overlay.style.position = 'absolute';
            overlay.style.top = 0;
            overlay.style.left = 0;
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.background = 'transparent';
            overlay.style.zIndex = 1000;
            overlay.style.pointerEvents = 'none';
            overlay.style.fontSize = '1.2rem';
            overlay.style.fontWeight = '600';
            overlay.style.color = '#222';
            // Ensure panel is positioned
            if (getComputedStyle(panel).position === 'static') {
                panel.style.position = 'relative';
            }
            panel.appendChild(overlay);
        }
        overlay.textContent = message;
        overlay.style.display = 'flex';
    }
}

function hideBlurOverlay() {
    const panel = document.querySelector('#email-generator, #summary-generator, #application-helper');
    if (panel) {
        const blurWrap = panel.querySelector('.ext-blur-wrap');
        if (blurWrap) blurWrap.style.filter = '';
        const overlay = panel.querySelector('.ext-blur-overlay');
        if (overlay) overlay.style.display = 'none';
    }
}