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

    return;
}

function radioDelegator(e) {
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
    return;
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
            setTimeout(() => {
                document.getElementById("output").innerText = "Error contacting server";
                hideBlurOverlay();  
            }, 2000);
            return;
        }

        
        // if (!res.ok) {
        //     document.getElementById("output").innerText = "Error contacting server";
        //     hideBlurOverlay();
        //     return;
        // }

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
            if (end <= start) {
            alert('End date cannot be before start date.');
            return;
            }
            payload = { mode: 'custom', start_date: start, end_date: end };
        } else {
            payload = { mode: 'last24' };
        }

        hideBlurOverlay();

        // TODO: POST to backend, then render summary
        const output = panel.querySelector('#output');
        output.textContent = `Generating summary for: ${JSON.stringify(payload)}`;
        // const res = await fetch(...)

        return;
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
    const panel = document.querySelector('#email-generator, #summary-generator');
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
    const panel = document.querySelector('#email-generator, #summary-generator');
    if (panel) {
        const blurWrap = panel.querySelector('.ext-blur-wrap');
        if (blurWrap) blurWrap.style.filter = '';
        const overlay = panel.querySelector('.ext-blur-overlay');
        if (overlay) overlay.style.display = 'none';
    }
}