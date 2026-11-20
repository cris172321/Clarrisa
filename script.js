/**
 * Cubao Expo Date Planner 💕
 * Interactive animations, calendar picker, answer recording & responses dashboard.
 */

document.addEventListener('DOMContentLoaded', () => {

  // =========================================================================
  // STATE MANAGEMENT
  // =========================================================================
  let selectedDate = null;
  let selectedDateString = "";
  let selectedTime = "4:30 PM";
  let currentMonthDate = new Date(); // Tracking calendar view
  let responses = [];

  // Elements
  const pages = {
    page1: document.getElementById('page1'),
    page2: document.getElementById('page2'),
    pagePlan: document.getElementById('pagePlan'),
    pageDateTime: document.getElementById('pageDateTime'),
    pageConfirmation: document.getElementById('pageConfirmation')
  };

  function goToPage(pageKey) {
    Object.keys(pages).forEach(key => {
      if (key === pageKey) {
        pages[key]?.classList.add('active');
      } else {
        pages[key]?.classList.remove('active');
      }
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Toast Helper
  const toastEl = document.getElementById('toastNotification');
  let toastTimer = null;
  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 3000);
  }

  // Fullscreen Toggle
  const fullscreenToggle = document.getElementById('fullscreenToggle');
  if (fullscreenToggle) {
    fullscreenToggle.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });
  }

  // =========================================================================
  // PAGE 1: "hii, pretty! can i bother you for a second?"
  // =========================================================================
  const p1YesBtn = document.getElementById('p1YesBtn');
  const p1NoBtn = document.getElementById('p1NoBtn');
  const p1SweetHint = document.getElementById('p1SweetHint');

  const p1NoMessages = [
    "Wait, really? Just 5 seconds please? 🥺",
    "Are you sure? Look at how pretty the Yes button is! ✨",
    "The No button is getting shy... click Yes na! 👉👈",
    "Pretty girls always click the pink button 💕",
    "No isn't an option hehe! Try clicking Yes 🥰"
  ];

  if (p1YesBtn) {
    p1YesBtn.addEventListener('click', () => {
      burstConfetti();
      goToPage('page2');
    });
  }

  const p1Counter = { val: 0 };
  function dodgeButtonWithHint(btn, hintEl, messages, counterRef, yesBtnRef) {
    const maxOffset = 90;
    const x = (Math.random() - 0.5) * maxOffset * 2;
    const y = (Math.random() - 0.5) * maxOffset * 1.5;
    btn.style.transform = `translate(${x}px, ${y}px)`;

    const msg = messages[counterRef.val % messages.length];
    counterRef.val++;
    if (hintEl) hintEl.textContent = msg;

    if (yesBtnRef) {
      const currentScale = 1 + Math.min(counterRef.val * 0.05, 0.35);
      yesBtnRef.style.transform = `scale(${currentScale})`;
    }
  }

  if (p1NoBtn) {
    p1NoBtn.addEventListener('mouseenter', () => dodgeButtonWithHint(p1NoBtn, p1SweetHint, p1NoMessages, p1Counter, p1YesBtn));
    p1NoBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      dodgeButtonWithHint(p1NoBtn, p1SweetHint, p1NoMessages, p1Counter, p1YesBtn);
    });
    p1NoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      dodgeButtonWithHint(p1NoBtn, p1SweetHint, p1NoMessages, p1Counter, p1YesBtn);
    });
  }

  // =========================================================================
  // PAGE 2: "will you go out with me and go to cubao expo?"
  // =========================================================================
  const p2YesBtn = document.getElementById('p2YesBtn');
  const p2NoBtn = document.getElementById('p2NoBtn');

  if (p2YesBtn) {
    p2YesBtn.addEventListener('click', () => {
      burstConfetti();
      goToPage('pagePlan');
    });
  }

  function dodgeButtonQuiet(btn, yesBtnRef) {
    const maxOffset = 100;
    const x = (Math.random() - 0.5) * maxOffset * 2;
    const y = (Math.random() - 0.5) * maxOffset * 1.5;
    btn.style.transform = `translate(${x}px, ${y}px)`;

    if (yesBtnRef) {
      const currentScale = 1.05;
      yesBtnRef.style.transform = `scale(${currentScale})`;
    }
  }

  if (p2NoBtn) {
    p2NoBtn.addEventListener('mouseenter', () => dodgeButtonQuiet(p2NoBtn, p2YesBtn));
    p2NoBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      dodgeButtonQuiet(p2NoBtn, p2YesBtn);
    });
    p2NoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      dodgeButtonQuiet(p2NoBtn, p2YesBtn);
    });
  }

  // =========================================================================
  // PAGE 3: THE PLAN ("Here's the plan:" + Picture switcher)
  // =========================================================================
  const planBackBtn = document.getElementById('planBackBtn');
  const planNextBtn = document.getElementById('planNextBtn');
  const mainPlanPhoto = document.getElementById('mainPlanPhoto');
  const photoDots = document.querySelectorAll('.photo-dot');

  photoDots.forEach(dot => {
    dot.addEventListener('click', () => {
      const src = dot.getAttribute('data-src');
      if (src && mainPlanPhoto) {
        mainPlanPhoto.src = src;
      }
      photoDots.forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
    });
  });

  if (planBackBtn) {
    planBackBtn.addEventListener('click', () => {
      goToPage('page2');
    });
  }

  if (planNextBtn) {
    planNextBtn.addEventListener('click', () => {
      goToPage('pageDateTime');
      initCalendar();
    });
  }

  // =========================================================================
  // PAGE 4: CALENDAR & TIME (No Emojis)
  // =========================================================================
  const calMonthYearTitle = document.getElementById('calMonthYearTitle');
  const calendarDaysGrid = document.getElementById('calendarDaysGrid');
  const calPrevMonth = document.getElementById('calPrevMonth');
  const calNextMonth = document.getElementById('calNextMonth');
  const summaryDateTimeDisplay = document.getElementById('summaryDateTimeDisplay');

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  function renderCalendar(targetDate) {
    if (!calendarDaysGrid || !calMonthYearTitle) return;

    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    calMonthYearTitle.textContent = `${monthNames[month]} ${year}`;

    calendarDaysGrid.innerHTML = "";

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < firstDayIndex; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'cal-day-cell empty';
      calendarDaysGrid.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayCell = document.createElement('button');
      dayCell.type = 'button';
      dayCell.className = 'cal-day-cell';
      dayCell.textContent = day;

      const cellDate = new Date(year, month, day);
      cellDate.setHours(0, 0, 0, 0);

      if (cellDate < today) {
        dayCell.classList.add('disabled');
        dayCell.disabled = true;
      } else {
        if (cellDate.getTime() === today.getTime()) {
          dayCell.classList.add('today');
        }

        if (selectedDate && cellDate.getTime() === selectedDate.getTime()) {
          dayCell.classList.add('selected');
        }

        dayCell.addEventListener('click', () => {
          selectCalendarDate(cellDate);
        });
      }

      calendarDaysGrid.appendChild(dayCell);
    }
  }

  function selectCalendarDate(dateObj) {
    selectedDate = new Date(dateObj);
    selectedDate.setHours(0, 0, 0, 0);

    const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
    selectedDateString = selectedDate.toLocaleDateString('en-US', options);

    renderCalendar(currentMonthDate);
    updateSummaryDisplay();
  }

  function updateSummaryDisplay() {
    if (!summaryDateTimeDisplay) return;
    if (selectedDateString && selectedTime) {
      summaryDateTimeDisplay.textContent = `${selectedDateString} • ${selectedTime}`;
      summaryDateTimeDisplay.style.color = '#d94676';
    } else if (selectedDateString) {
      summaryDateTimeDisplay.textContent = `${selectedDateString} • (Please pick a time)`;
    } else {
      summaryDateTimeDisplay.textContent = `Please choose a date & time above`;
    }
  }

  if (calPrevMonth) {
    calPrevMonth.addEventListener('click', () => {
      currentMonthDate.setMonth(currentMonthDate.getMonth() - 1);
      renderCalendar(currentMonthDate);
    });
  }

  if (calNextMonth) {
    calNextMonth.addEventListener('click', () => {
      currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
      renderCalendar(currentMonthDate);
    });
  }

  function getNextDayOfWeek(dayOfWeek) {
    const today = new Date();
    const resultDate = new Date(today.getTime());
    const currentDay = today.getDay();
    let distance = (dayOfWeek - currentDay + 7) % 7;
    if (distance === 0) distance = 7;
    resultDate.setDate(today.getDate() + distance);
    return resultDate;
  }

  const chipThisSat = document.getElementById('chipThisSat');
  const chipThisSun = document.getElementById('chipThisSun');
  const chipNextSat = document.getElementById('chipNextSat');
  const chipSurprise = document.getElementById('chipSurprise');

  if (chipThisSat) {
    chipThisSat.addEventListener('click', () => {
      const sat = getNextDayOfWeek(6);
      currentMonthDate = new Date(sat);
      selectCalendarDate(sat);
      showToast("Selected this Saturday");
    });
  }

  if (chipThisSun) {
    chipThisSun.addEventListener('click', () => {
      const sun = getNextDayOfWeek(0);
      currentMonthDate = new Date(sun);
      selectCalendarDate(sun);
      showToast("Selected this Sunday");
    });
  }

  if (chipNextSat) {
    chipNextSat.addEventListener('click', () => {
      const sat = getNextDayOfWeek(6);
      sat.setDate(sat.getDate() + 7);
      currentMonthDate = new Date(sat);
      selectCalendarDate(sat);
      showToast("Selected next Saturday");
    });
  }

  if (chipSurprise) {
    chipSurprise.addEventListener('click', () => {
      const sat = getNextDayOfWeek(6);
      currentMonthDate = new Date(sat);
      selectCalendarDate(sat);
      showToast("I'll plan the weekend");
    });
  }

  // Time Slot Selection Handling (clean values)
  const timeRadios = document.querySelectorAll('input[name="timeSlot"]');
  const customTimePicker = document.getElementById('customTimePicker');
  const customTimeRadio = document.getElementById('customTimeRadio');

  timeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'custom') {
        const timeVal = customTimePicker ? formatTime12h(customTimePicker.value) : "4:00 PM";
        selectedTime = `${timeVal} (Custom Time)`;
      } else {
        selectedTime = radio.value;
      }
      updateSummaryDisplay();
    });
  });

  if (customTimePicker) {
    customTimePicker.addEventListener('input', () => {
      if (customTimeRadio) customTimeRadio.checked = true;
      const formatted = formatTime12h(customTimePicker.value);
      selectedTime = `${formatted} (Custom Time)`;
      updateSummaryDisplay();
    });
  }

  function formatTime12h(timeStr) {
    if (!timeStr) return "4:00 PM";
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${m < 10 ? '0' + m : m} ${period}`;
  }

  function initCalendar() {
    const defaultDate = getNextDayOfWeek(6);
    currentMonthDate = new Date(defaultDate);
    selectCalendarDate(defaultDate);
    const defaultRadio = document.querySelector('input[name="timeSlot"][value="4:30 PM"]');
    if (defaultRadio) defaultRadio.checked = true;
  }

  // Navigation: Back from Page 4 to Page 3 (Plan)
  const dateTimeBackBtn = document.getElementById('dateTimeBackBtn');
  if (dateTimeBackBtn) {
    dateTimeBackBtn.addEventListener('click', () => {
      goToPage('pagePlan');
    });
  }

  // Confirm Date Button on Page 4
  const sealDateBtn = document.getElementById('sealDateBtn');
  if (sealDateBtn) {
    sealDateBtn.addEventListener('click', () => {
      if (!selectedDateString) {
        showToast("Please tap on a date in the calendar first");
        return;
      }

      const responsePayload = {
        date: selectedDateString,
        time: selectedTime || "4:30 PM"
      };

      // Record answers
      saveDateResponse(responsePayload);

      // Celebration confetti
      burstConfetti(100);

      // Populate Ticket
      populateTicket(responsePayload);

      // Transition to Ticket Screen
      goToPage('pageConfirmation');
      showToast("Date confirmed and answers recorded");
    });
  }

  // =========================================================================
  // ANSWER RECORDING SYSTEM
  // =========================================================================
  async function saveDateResponse(data) {
    const timestamp = new Date().toLocaleString();
    const record = {
      id: Date.now().toString(),
      timestamp: timestamp,
      ...data
    };

    // Save to LocalStorage
    try {
      const stored = JSON.parse(localStorage.getItem('cubao_date_responses') || '[]');
      stored.unshift(record);
      localStorage.setItem('cubao_date_responses', JSON.stringify(stored));
      responses = stored;
      updateAdminBadge();
    } catch (e) {
      console.warn("LocalStorage warning:", e);
    }

    // Save to Server answers_log.txt and responses.json
    try {
      await fetch('/api/save-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (err) {
      // Safe fallback
    }

    loadResponses();
  }

  // =========================================================================
  // TICKET CONFIRMATION & ACTIONS (No Emojis)
  // =========================================================================
  const ticketDateDisplay = document.getElementById('ticketDateDisplay');
  const ticketTimeDisplay = document.getElementById('ticketTimeDisplay');
  let latestData = null;

  function populateTicket(data) {
    latestData = data;
    if (ticketDateDisplay) ticketDateDisplay.textContent = data.date;
    if (ticketTimeDisplay) ticketTimeDisplay.textContent = data.time;
  }

  // "Send to Him / Copy Summary"
  const sendToHimBtn = document.getElementById('sendToHimBtn');
  if (sendToHimBtn) {
    sendToHimBtn.addEventListener('click', () => {
      if (!latestData) return;
      const formatted = `It's a Date at Cubao Expo!
Date: ${latestData.date}
Time: ${latestData.time}

Here's the plan:
1. Go to church first
2. Head over to Cubao Expo
3. Take a lot of pictures of you
4. Eat dinner together
5. Walk you safely to your ride home

See you soon, pretty!`;

      navigator.clipboard.writeText(formatted).then(() => {
        showToast("Summary copied to clipboard! Send it to him in chat");
      }).catch(() => {
        showToast("Please screenshot or save your ticket");
      });
    });
  }

  // Print Ticket
  const printTicketBtn = document.getElementById('printTicketBtn');
  if (printTicketBtn) {
    printTicketBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Change Date or Time Button
  const restartBtn = document.getElementById('restartBtn');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      goToPage('pageDateTime');
    });
  }

  // =========================================================================
  // ADMIN / RECORDED ANSWERS MODAL (No Emojis)
  // =========================================================================
  const viewAnswersBtn = document.getElementById('viewAnswersBtn');
  const answersModal = document.getElementById('answersModal');
  const closeAnswersModal = document.getElementById('closeAnswersModal');
  const responsesListContainer = document.getElementById('responsesListContainer');
  const responseCountBadge = document.getElementById('responseCountBadge');
  const copyAllSummaryBtn = document.getElementById('copyAllSummaryBtn');
  const downloadAnswersTxtBtn = document.getElementById('downloadAnswersTxtBtn');
  const clearResponsesBtn = document.getElementById('clearResponsesBtn');

  function updateAdminBadge() {
    if (responseCountBadge) {
      responseCountBadge.textContent = responses.length;
      responseCountBadge.style.display = responses.length > 0 ? 'inline-block' : 'none';
    }
  }

  async function loadResponses() {
    try {
      const res = await fetch('/api/responses');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          responses = data.reverse();
          updateAdminBadge();
          renderResponsesList();
          return;
        }
      }
    } catch (e) {}

    try {
      const stored = JSON.parse(localStorage.getItem('cubao_date_responses') || '[]');
      responses = stored;
      updateAdminBadge();
      renderResponsesList();
    } catch (e) {
      responses = [];
    }
  }

  function renderResponsesList() {
    if (!responsesListContainer) return;
    if (responses.length === 0) {
      responsesListContainer.innerHTML = `
        <div class="empty-state">
          <h4>No responses recorded yet</h4>
          <p>When she picks a date and time, her answers will appear right here!</p>
        </div>
      `;
      return;
    }

    responsesListContainer.innerHTML = responses.map(item => `
      <div class="response-card">
        <div class="response-card-head">
          <span class="resp-timestamp">${item.timestamp || 'Just now'}</span>
          <span class="resp-date-badge">${item.date}</span>
        </div>
        <div class="resp-details-grid">
          <div class="resp-line"><strong>Time Chosen:</strong> ${item.time}</div>
        </div>
      </div>
    `).join('');
  }

  if (viewAnswersBtn) {
    viewAnswersBtn.addEventListener('click', () => {
      loadResponses();
      if (answersModal) answersModal.classList.add('open');
    });
  }

  if (closeAnswersModal) {
    closeAnswersModal.addEventListener('click', () => {
      if (answersModal) answersModal.classList.remove('open');
    });
  }

  if (answersModal) {
    answersModal.addEventListener('click', (e) => {
      if (e.target === answersModal) {
        answersModal.classList.remove('open');
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
      e.preventDefault();
      loadResponses();
      if (answersModal) answersModal.classList.toggle('open');
    }
  });

  if (copyAllSummaryBtn) {
    copyAllSummaryBtn.addEventListener('click', () => {
      if (responses.length === 0) {
        showToast("No responses to copy yet");
        return;
      }
      const latest = responses[0];
      const text = `CUBAO EXPO DATE RESPONSE:
Date: ${latest.date}
Time: ${latest.time}
Submitted: ${latest.timestamp}`;

      navigator.clipboard.writeText(text).then(() => {
        showToast("Summary copied to clipboard");
      });
    });
  }

  if (downloadAnswersTxtBtn) {
    downloadAnswersTxtBtn.addEventListener('click', () => {
      if (responses.length === 0) {
        showToast("No responses to download yet");
        return;
      }
      let content = "==================================================\n";
      content += "CUBAO EXPO DATE RESPONSES LOG\n";
      content += "==================================================\n\n";

      responses.forEach((resp, i) => {
        content += `[Entry #${i + 1}] - ${resp.timestamp}\n`;
        content += `Date: ${resp.date}\n`;
        content += `Time: ${resp.time}\n`;
        content += "--------------------------------------------------\n\n";
      });

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cubao_expo_date_answers.txt`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Downloaded date responses log");
    });
  }

  if (clearResponsesBtn) {
    clearResponsesBtn.addEventListener('click', async () => {
      if (confirm("Are you sure you want to clear test responses?")) {
        localStorage.removeItem('cubao_date_responses');
        responses = [];
        try {
          await fetch('/api/clear-responses', { method: 'POST' });
        } catch (e) {}
        updateAdminBadge();
        renderResponsesList();
        showToast("Responses cleared");
      }
    });
  }

  loadResponses();

  // =========================================================================
  // AMBIENT PARTICLES CANVAS (Hearts & Sparkles)
  // =========================================================================
  const canvas = document.getElementById('ambientCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const particleCount = 28;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 8 + 5,
        speedX: (Math.random() - 0.5) * 0.8,
        speedY: Math.random() * 0.9 + 0.4,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.02,
        opacity: Math.random() * 0.4 + 0.25,
        type: Math.random() > 0.5 ? 'heart' : 'sparkle'
      });
    }

    function drawHeart(c, x, y, size, opacity) {
      c.save();
      c.translate(x, y);
      c.scale(size / 15, size / 15);
      c.fillStyle = `rgba(255, 120, 150, ${opacity})`;
      c.beginPath();
      c.moveTo(0, 0);
      c.bezierCurveTo(-5, -5, -10, 0, 0, 10);
      c.bezierCurveTo(10, 0, 5, -5, 0, 0);
      c.fill();
      c.restore;
      c.restore();
    }

    function drawSparkle(c, x, y, size, opacity) {
      c.save();
      c.translate(x, y);
      c.fillStyle = `rgba(255, 200, 220, ${opacity})`;
      c.beginPath();
      c.arc(0, 0, size * 0.4, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }

    function animateParticles() {
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.angle += p.spin;

        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
        }
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;

        if (p.type === 'heart') {
          drawHeart(ctx, p.x, p.y, p.size, p.opacity);
        } else {
          drawSparkle(ctx, p.x, p.y, p.size, p.opacity);
        }
      });

      requestAnimationFrame(animateParticles);
    }

    animateParticles();
  }

  // =========================================================================
  // CELEBRATION CONFETTI BURST
  // =========================================================================
  function burstConfetti(amount = 70) {
    const colors = ['#ff6584', '#ff8fab', '#ffaebf', '#ffd166', '#a0c4ff', '#b9fbc0'];
    const container = document.body;

    for (let i = 0; i < amount; i++) {
      const piece = document.createElement('div');
      piece.style.position = 'fixed';
      piece.style.zIndex = '9999';
      piece.style.pointerEvents = 'none';
      piece.style.width = `${Math.random() * 9 + 6}px`;
      piece.style.height = `${Math.random() * 9 + 6}px`;
      piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      piece.style.borderRadius = Math.random() > 0.4 ? '50%' : '2px';
      piece.style.left = '50%';
      piece.style.top = '50%';

      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 320 + 120;
      const destX = Math.cos(angle) * velocity;
      const destY = Math.sin(angle) * velocity + 150;
      const rot = Math.random() * 720 - 360;

      piece.style.transition = 'transform 1.4s cubic-bezier(0.12, 0.8, 0.32, 1), opacity 1.4s ease';
      container.appendChild(piece);

      requestAnimationFrame(() => {
        piece.style.transform = `translate(${destX}px, ${destY}px) rotate(${rot}deg) scale(0.6)`;
        piece.style.opacity = '0';
      });

      setTimeout(() => {
        if (piece.parentNode) piece.parentNode.removeChild(piece);
      }, 1500);
    }
  }

});
