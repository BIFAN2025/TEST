/*
  script.js
  This file contains all of the interactive behaviour for Yuri’s dashboard. It
  manages navigation between sections, fetches real‑time weather data for
  Haeundae‑gu, initialises a calendar with persistent events, provides a simple
  to‑do list and notes system stored in the browser, and wires up a chat
  powered by Firebase Firestore. Replace the API keys and configuration
  placeholders below with your own credentials.
*/

// ----- Configuration -----

// OpenWeatherMap API key. Sign up at https://openweathermap.org/api to obtain
// your key. This key is required to fetch weather data.
const weatherApiKey = 'YOUR_OPENWEATHERMAP_API_KEY';

// Firebase configuration for the chat feature. Create a project at
// https://console.firebase.google.com/ and enable Cloud Firestore. Replace
// the fields below with the values from your Firebase project settings.
const firebaseConfig = {
  apiKey: 'YOUR_FIREBASE_API_KEY',
  authDomain: 'YOUR_FIREBASE_AUTH_DOMAIN',
  projectId: 'YOUR_FIREBASE_PROJECT_ID',
  storageBucket: 'YOUR_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_FIREBASE_SENDER_ID',
  appId: 'YOUR_FIREBASE_APP_ID'
};

// Coordinates for Haeundae‑gu, Busan (South Korea) according to latitude/longitude
// data【311374209617291†L19-L35】.
const haeundaeLat = 35.16665;
const haeundaeLon = 129.16792;

// ----- Weather -----

/**
 * Fetches current weather for Haeundae‑gu and updates the DOM with
 * temperature, description and icon. If the API key is missing or invalid,
 * the weather card will simply remain blank.
 */
function fetchWeather() {
  if (!weatherApiKey || weatherApiKey === 'YOUR_OPENWEATHERMAP_API_KEY') {
    console.warn('Please provide a valid OpenWeatherMap API key.');
    return;
  }
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${haeundaeLat}&lon=${haeundaeLon}&appid=${weatherApiKey}&units=metric&lang=kr`;
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      // Build HTML for the weather panel
      const icon = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
      const location = data.name;
      const temperature = data.main.temp.toFixed(1);
      const description = data.weather[0].description;
      const weatherHtml = `
        <img src="${icon}" alt="${description}" />
        <div>
          <p><strong>${location}</strong></p>
          <p>${temperature}°C – ${description}</p>
        </div>
      `;
      document.getElementById('weather-info').innerHTML = weatherHtml;
    })
    .catch((error) => {
      console.error('Error fetching weather:', error);
    });
}

// ----- Calendar -----

/**
 * Initialises FullCalendar within the given container, reading any saved
 * events from localStorage. Events can be added via the form below the
 * calendar and will persist across page reloads. Editing and deleting of
 * events via the calendar UI will update local storage automatically.
 */
function initCalendar() {
  const calendarEl = document.getElementById('calendar-container');
  // Retrieve saved events from local storage or default to an empty array
  let savedEvents = JSON.parse(localStorage.getItem('events')) || [];
  // Convert ISO date strings back into actual Date objects for FullCalendar
  const parsedEvents = savedEvents.map((evt) => {
    return {
      title: evt.title,
      start: evt.start,
      end: evt.end || null
    };
  });
  // Create the calendar
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    editable: true,
    selectable: true,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    },
    events: parsedEvents,
    eventAdd: updateStoredEvents,
    eventChange: updateStoredEvents,
    eventRemove: updateStoredEvents
  });
  calendar.render();
  // Add new events via the form
  document.getElementById('add-event').addEventListener('click', () => {
    const titleInput = document.getElementById('event-title');
    const dateInput = document.getElementById('event-date');
    const title = titleInput.value.trim();
    const date = dateInput.value;
    if (!title || !date) {
      return;
    }
    const eventObj = { title: title, start: date };
    calendar.addEvent(eventObj);
    // Save to local storage
    savedEvents.push(eventObj);
    localStorage.setItem('events', JSON.stringify(savedEvents));
    // Reset form
    titleInput.value = '';
    dateInput.value = '';
  });
  /**
   * Updates the stored events whenever the calendar is mutated (add/change/remove).
   */
  function updateStoredEvents() {
    const events = calendar.getEvents().map((evt) => ({
      title: evt.title,
      start: evt.start.toISOString(),
      end: evt.end ? evt.end.toISOString() : null
    }));
    localStorage.setItem('events', JSON.stringify(events));
  }
}

// ----- To‑Do list -----

/**
 * Loads tasks from localStorage and renders them to the DOM. Each task can be
 * toggled between completed and not completed by clicking its text, and
 * removed using the delete button.
 */
function loadTasks() {
  const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  const list = document.getElementById('todo-list');
  list.innerHTML = '';
  tasks.forEach((task, index) => {
    const li = document.createElement('li');
    if (task.completed) {
      li.classList.add('completed');
    }
    const textSpan = document.createElement('span');
    textSpan.textContent = task.text;
    textSpan.addEventListener('click', () => toggleTask(index));
    const delButton = document.createElement('button');
    delButton.innerHTML = '<i class="fa fa-trash"></i>';
    delButton.addEventListener('click', () => deleteTask(index));
    li.appendChild(textSpan);
    li.appendChild(delButton);
    list.appendChild(li);
  });
}

/**
 * Handles the form submission for adding a new task. Saves it to
 * localStorage and refreshes the task list.
 */
function addTask(event) {
  event.preventDefault();
  const input = document.getElementById('todo-input');
  const text = input.value.trim();
  if (!text) return;
  const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  tasks.push({ text: text, completed: false });
  localStorage.setItem('tasks', JSON.stringify(tasks));
  input.value = '';
  loadTasks();
}

/**
 * Toggles completion state of a task at the given index.
 * @param {number} index
 */
function toggleTask(index) {
  const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  tasks[index].completed = !tasks[index].completed;
  localStorage.setItem('tasks', JSON.stringify(tasks));
  loadTasks();
}

/**
 * Deletes a task at the given index and updates storage.
 * @param {number} index
 */
function deleteTask(index) {
  const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  tasks.splice(index, 1);
  localStorage.setItem('tasks', JSON.stringify(tasks));
  loadTasks();
}

// ----- Notes -----

/**
 * Loads saved notes from localStorage and renders them to the DOM. Each
 * note consists of a textarea for editing and a delete button. Notes are
 * persisted as an array of strings.
 */
function loadNotes() {
  const notes = JSON.parse(localStorage.getItem('notes')) || [];
  const container = document.getElementById('notes-container');
  container.innerHTML = '';
  notes.forEach((note, index) => {
    const noteDiv = document.createElement('div');
    noteDiv.className = 'note';
    const textarea = document.createElement('textarea');
    textarea.value = note;
    textarea.addEventListener('input', () => updateNote(index, textarea.value));
    const delBtn = document.createElement('button');
    delBtn.className = 'delete-note';
    delBtn.innerHTML = '<i class="fa fa-trash"></i>';
    delBtn.addEventListener('click', () => deleteNote(index));
    noteDiv.appendChild(textarea);
    noteDiv.appendChild(delBtn);
    container.appendChild(noteDiv);
  });
}

/**
 * Adds a new note with an empty string and refreshes the notes container.
 */
function addNote() {
  const notes = JSON.parse(localStorage.getItem('notes')) || [];
  notes.push('');
  localStorage.setItem('notes', JSON.stringify(notes));
  loadNotes();
}

/**
 * Updates the content of a note at a given index.
 * @param {number} index
 * @param {string} value
 */
function updateNote(index, value) {
  const notes = JSON.parse(localStorage.getItem('notes')) || [];
  notes[index] = value;
  localStorage.setItem('notes', JSON.stringify(notes));
}

/**
 * Deletes a note at the given index.
 * @param {number} index
 */
function deleteNote(index) {
  const notes = JSON.parse(localStorage.getItem('notes')) || [];
  notes.splice(index, 1);
  localStorage.setItem('notes', JSON.stringify(notes));
  loadNotes();
}

// ----- Chat -----

/**
 * Initialises Firebase and sets up a real‑time listener for chat messages. It
 * attaches an event handler to the chat form to submit new messages. Note:
 * messages are stored publicly in your Firestore database, so avoid
 * sensitive information. Make sure to replace the firebaseConfig with your
 * own credentials before deploying.
 */
function initChat() {
  try {
    // Initialise Firebase only if config provided
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
  } catch (err) {
    console.warn('Firebase initialisation failed. Check your configuration.', err);
    return;
  }
  const db = firebase.firestore();
  const messagesRef = db.collection('messages');
  const messagesContainer = document.getElementById('chat-messages');
  // Real‑time listener for messages
  messagesRef.orderBy('timestamp').onSnapshot((snapshot) => {
    messagesContainer.innerHTML = '';
    snapshot.forEach((doc) => {
      const data = doc.data();
      const messageEl = document.createElement('div');
      messageEl.className = 'message';
      const name = data.name ? data.name : '익명';
      messageEl.textContent = `${name}: ${data.text}`;
      messagesContainer.appendChild(messageEl);
    });
    // Scroll to the newest message
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  });
  // Handle form submission
  const chatForm = document.getElementById('chat-form');
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('chat-name').value.trim();
    const text = document.getElementById('chat-message').value.trim();
    if (!text) return;
    messagesRef
      .add({
        name: name,
        text: text,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      })
      .catch((err) => console.error('Error sending message:', err));
    document.getElementById('chat-message').value = '';
  });
}

// ----- Navigation -----

/**
 * Attaches click handlers to navigation items so that clicking them scrolls
 * smoothly to the corresponding section. Sections are always visible; the nav
 * acts as a quick-jump menu. The active class is still applied for visual
 * feedback.
 */
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      // Highlight the clicked nav item for visual feedback
      document.querySelectorAll('.nav-item.active').forEach((el) => el.classList.remove('active'));
      item.classList.add('active');
      // Default anchor link handles scrolling automatically
    });
  });
}

// ----- Initialisation -----

document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  fetchWeather();
  initCalendar();
  // To‑Do list
  loadTasks();
  document.getElementById('todo-form').addEventListener('submit', addTask);
  // Notes
  loadNotes();
  document.getElementById('add-note-btn').addEventListener('click', addNote);
  // Chat
  initChat();
});