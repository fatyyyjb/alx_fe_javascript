// ------------------ DOM Elements ------------------
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const categoryFilter = document.getElementById("categoryFilter");
const importFileInput = document.getElementById("importFile");
const exportBtn = document.getElementById("exportBtn");

// ------------------ Local Storage & Initial Quotes ------------------
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { id: 1, text: "The best way to predict the future is to invent it.", category: "Inspiration" },
  { id: 2, text: "Life is what happens when you’re busy making other plans.", category: "Life" },
  { id: 3, text: "Do or do not. There is no try.", category: "Motivation" }
];

let lastQuoteIndex = sessionStorage.getItem("lastQuoteIndex");

// ------------------ Server Simulation ------------------
const serverUrl = "https://jsonplaceholder.typicode.com/posts"; // Mock API

// ------------------ Storage Functions ------------------
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

function populateCategories() {
  const categories = ["all", ...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = "";
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  // Restore last selected category
  const lastCategory = localStorage.getItem("lastCategory") || "all";
  categoryFilter.value = lastCategory;
}

// ------------------ Quote Display & Filtering ------------------
function showRandomQuote() {
  const selectedCategory = categoryFilter.value;
  const filteredQuotes = selectedCategory === "all" 
    ? quotes 
    : quotes.filter(q => q.category === selectedCategory);

  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes available for this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const randomQuote = filteredQuotes[randomIndex];
  quoteDisplay.textContent = `"${randomQuote.text}" — ${randomQuote.category}`;

  // Save last viewed quote in sessionStorage
  sessionStorage.setItem("lastQuoteIndex", randomIndex);
}

function filterQuotes() {
  const selectedCategory = categoryFilter.value;
  localStorage.setItem("lastCategory", selectedCategory);
  showRandomQuote();
}

// ------------------ Add Quote Form ------------------
function createAddQuoteForm() {
  const formDiv = document.createElement("div");
  formDiv.style.marginTop = "20px";

  const quoteInput = document.createElement("input");
  quoteInput.id = "newQuoteText";
  quoteInput.type = "text";
  quoteInput.placeholder = "Enter a new quote";

  const categoryInput = document.createElement("input");
  categoryInput.id = "newQuoteCategory";
  categoryInput.type = "text";
  categoryInput.placeholder = "Enter quote category";

  const addBtn = document.createElement("button");
  addBtn.textContent = "Add Quote";

  formDiv.appendChild(quoteInput);
  formDiv.appendChild(categoryInput);
  formDiv.appendChild(addBtn);

  document.body.appendChild(formDiv);

  addBtn.addEventListener("click", () => {
    const text = quoteInput.value.trim();
    const category = categoryInput.value.trim();
    if (text && category) {
      addQuote(text, category);
      quoteInput.value = "";
      categoryInput.value = "";
    } else {
      alert("Please fill in both fields!");
    }
  });
}

function addQuote(text, category) {
  const newQuote = {
    id: Date.now(), // unique id
    text,
    category
  };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories();
  filterQuotes();
  alert("Quote added successfully!");

  // ------------------ POST to server ------------------
  fetch(serverUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(newQuote)
  })
  .then(response => response.json())
  .then(data => {
    console.log("Quote sent to server:", data);
  })
  .catch(err => console.error("Error posting quote:", err));
}

// ------------------ JSON Import/Export ------------------
function exportQuotes() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      importedQuotes.forEach(q => {
        if (!q.id) q.id = Date.now() + Math.floor(Math.random() * 1000);
      });
      quotes.push(...importedQuotes);
      saveQuotes();
      populateCategories();
      filterQuotes();
      alert("Quotes imported successfully!");
    } catch (err) {
      alert("Invalid JSON file.");
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// ------------------ Server Sync & Conflict Resolution ------------------
async function fetchQuotesFromServer() {
  try {
    const response = await fetch(serverUrl);
    const serverQuotes = await response.json();

    let updated = false;
    serverQuotes.forEach(sq => {
      const exists = quotes.find(lq => lq.id === sq.id);
      if (!exists) {
        quotes.push({ id: sq.id, text: sq.title || sq.text, category: sq.category || "Uncategorized" });
        updated = true;
      }
    });

    if (updated) {
      saveQuotes();
      populateCategories();
      filterQuotes();
      alert("Quotes updated from server!");
    }

  } catch (err) {
    console.error("Error fetching quotes from server:", err);
  }
}

// Run sync every 30 seconds
setInterval(fetchQuotesFromServer, 30000);

// ------------------ Event Listeners ------------------
newQuoteBtn.addEventListener("click", showRandomQuote);
importFileInput.addEventListener("change", importFromJsonFile);
exportBtn.addEventListener("click", exportQuotes);

// ------------------ Initialize App ------------------
populateCategories();
createAddQuoteForm();
filterQuotes(); // show quote from last selected category
