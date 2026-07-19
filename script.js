/*   1. CONSTANTS
   Values that never change while the app is running.
   Writing them here means we don't repeat the same numbers
   in multiple places in the code. */
const API_URL = "https://jsonplaceholder.typicode.com/posts";
const MAX_MESSAGE_LENGTH = 500;
const MIN_MESSAGE_LENGTH = 10;
const MIN_NAME_LENGTH = 3;
const MAX_NAME_LENGTH = 50;

// Key used to store our list of recent submissions in the browser's
// localStorage. localStorage saves data on the user's own computer,
// so it stays there even after closing/reopening the browser.
const STORAGE_KEY = "recentFeedbackSubmissions";

// We only want to keep and display the last 5 submissions
const MAX_STORED_SUBMISSIONS = 5;

const form = document.getElementById("feedbackForm");
const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const categorySelect = document.getElementById("category");
const messageInput = document.getElementById("message");

const submitBtn = document.getElementById("submitBtn");
const submitBtnText = document.getElementById("submitBtnText");
const spinner = document.getElementById("spinner");

const formStatus = document.getElementById("formStatus");
const messageCounter = document.getElementById("messageCounter");
const postsList = document.getElementById("postsList");


/* 3. VALIDATION FUNCTIONS
   Each function checks ONE field and returns:
     - an error message (string) if the value is invalid
     - an empty string "" if the value is valid
   Keeping them separate makes the code easy to read and test.*/

function validateFullName(value) {
  const trimmed = value.trim(); // remove extra spaces from both ends
  if (trimmed === "") {
    return "Full name is required.";
  }
  if (trimmed.length < MIN_NAME_LENGTH) {
    return `Name must be at least ${MIN_NAME_LENGTH} characters.`;
  }
  if (trimmed.length > MAX_NAME_LENGTH) {
    return `Name must not exceed ${MAX_NAME_LENGTH} characters.`;
  }
  return ""; // no error = valid
}

function validateEmail(value) {
  const trimmed = value.trim();

  // Simple regex pattern to check for a valid-looking email format:
  // something@something.something
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (trimmed === "") {
    return "Email is required.";
  }
  if (!emailPattern.test(trimmed)) {
    return "Please enter a valid email address.";
  }
  return "";
}

function validateCategory(value) {
  if (value === "") {
    return "Please select a category.";
  }
  return "";
}

function validateRating(value) {
  // value will be "" if no radio button is checked
  if (!value) {
    return "Please select a rating.";
  }
  return "";
}

function validateMessage(value) {
  const trimmed = value.trim();
  if (trimmed === "") {
    return "Message is required.";
  }
  if (trimmed.length < MIN_MESSAGE_LENGTH) {
    return `Message must be at least ${MIN_MESSAGE_LENGTH} characters.`;
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return `Message must not exceed ${MAX_MESSAGE_LENGTH} characters.`;
  }
  return "";
}


/* ----------------------------------------------------------
   4. HELPER FUNCTIONS
   Small reusable functions used by the submit handler.
   ---------------------------------------------------------- */

/**
 * Displays (or clears) an error message under a specific field,
 * and adds/removes the red "invalid" border style.
 */
function showFieldError(inputElement, errorElementId, message) {
  const errorElement = document.getElementById(errorElementId);
  errorElement.textContent = message;

  if (message) {
    inputElement.classList.add("invalid");
  } else {
    inputElement.classList.remove("invalid");
  }
}

/**
 * Clears every error message and every red border on the form.
 * Called after a successful submission.
 */
function clearAllErrors() {
  document.querySelectorAll(".error-message").forEach(function (el) {
    el.textContent = "";
  });
  document.querySelectorAll(".invalid").forEach(function (el) {
    el.classList.remove("invalid");
  });
  document.querySelector(".rating-group").classList.remove("invalid");
}

/**
 * Shows the green success banner or the red error banner
 * above the form.
 */
function showStatusMessage(message, type) {
  formStatus.textContent = message;
  formStatus.className = "form-status " + type; // type is "success" or "error"
}

function clearStatusMessage() {
  formStatus.textContent = "";
  formStatus.className = "form-status";
}

/**
 * Turns the loading state of the submit button on or off.
 * While loading:
 *   - button becomes disabled (user cannot click it twice)
 *   - button text changes to "Submitting..."
 *   - a small spinner icon appears
 */
function setLoadingState(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtnText.textContent = isLoading ? "Submitting..." : "Submit Feedback";
  spinner.classList.toggle("hidden", !isLoading);
}


messageInput.addEventListener("input", function () {
  const currentLength = messageInput.value.length;
  messageCounter.textContent = currentLength + "/" + MAX_MESSAGE_LENGTH;

  // If the user somehow goes over the limit, turn the counter red
  messageCounter.classList.toggle("limit-warning", currentLength > MAX_MESSAGE_LENGTH);
});


/* Runs all 5 validation functions together. */
function validateForm() {
  const nameValue = fullNameInput.value;
  const emailValue = emailInput.value;
  const categoryValue = categorySelect.value;

  // Find which rating radio button (if any) is currently checked
  const checkedRatingInput = form.querySelector('input[name="rating"]:checked');
  const ratingValue = checkedRatingInput ? checkedRatingInput.value : "";

  const messageValue = messageInput.value;

  // Run each validator
  const nameError = validateFullName(nameValue);
  const emailError = validateEmail(emailValue);
  const categoryError = validateCategory(categoryValue);
  const ratingError = validateRating(ratingValue);
  const messageError = validateMessage(messageValue);

  // Show each error message (or clear it if there is none)
  showFieldError(fullNameInput, "fullNameError", nameError);
  showFieldError(emailInput, "emailError", emailError);
  showFieldError(categorySelect, "categoryError", categoryError);
  showFieldError(messageInput, "messageError", messageError);

  // The rating group is a fieldset, not a single input,
  // so we handle its error display slightly differently
  document.getElementById("ratingError").textContent = ratingError;
  document.querySelector(".rating-group").classList.toggle("invalid", Boolean(ratingError));

  // The form is valid only if ALL error messages are empty
  const isValid = !nameError && !emailError && !categoryError && !ratingError && !messageError;

  return {
    isValid: isValid,
    data: {
      name: nameValue.trim(),
      email: emailValue.trim(),
      category: categoryValue,
      rating: Number(ratingValue),
      message: messageValue.trim(),
    },
  };
}


/* ----------------------------------------------------------
   6. FORM SUBMIT HANDLER
   This is where validation + the fetch() POST request happen.
   ---------------------------------------------------------- */
form.addEventListener("submit", async function (event) {
  // Stop the browser from doing its default action (reloading the page)
  event.preventDefault();

  clearStatusMessage();

  // Step 1: Validate everything first
  const validationResult = validateForm();

  if (!validationResult.isValid) {
    showStatusMessage("Please fix the errors below and try again.", "error");
    return; // stop here, do not send the request
  }

  const feedbackData = validationResult.data;

  // Step 2: Show loading state before sending the request
  setLoadingState(true);

  try {
    // Step 3: Send the data to the API using fetch()
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(feedbackData),
    });

    // IMPORTANT: fetch() does NOT throw an error for 404 or 500 responses.
    // We must manually check response.ok to know if the request succeeded.
    if (!response.ok) {
      throw new Error("Server responded with status " + response.status);
    }

    // Step 4: Read the JSON body of the response
    const result = await response.json();

    // Step 5: Show the success message with the name and returned ID
    showStatusMessage(
      "Thanks, " + feedbackData.name + "! Saved with ID " + result.id + ".",
      "success"
    );

    // Step 6: Save this submission locally so it appears in
    // "Recent Submissions" below the form
    saveSubmissionLocally(feedbackData);

    // Step 7: Reset the form back to empty, and clear old error messages
    form.reset();
    clearAllErrors();
    messageCounter.textContent = "0/" + MAX_MESSAGE_LENGTH;

  } catch (error) {
    // This block runs for both network errors (no internet)
    // AND for the manual "throw" above when response.ok is false
    showStatusMessage(
      "Something went wrong while submitting your feedback. Please try again.",
      "error"
    );
    console.error("Submission error:", error);
    // Note: we do NOT reset the form here, so the user does not lose their input

  } finally {
    // This always runs, whether it succeeded or failed
    setLoadingState(false);
  }
});


/* ----------------------------------------------------------
   7. RECENT SUBMISSIONS LIST (Bonus Feature)

   Instead of showing random dummy posts from the API, this list
   shows the REAL feedback that was submitted from this browser,
   most recent first, capped at the last 5 entries.

   We use localStorage to remember these submissions even if the
   page is refreshed or closed and reopened later.
   ---------------------------------------------------------- */

/**
 * Reads the saved submissions array from localStorage.
 * Returns an empty array if nothing has been saved yet.
 */
function getStoredSubmissions() {
  const rawData = localStorage.getItem(STORAGE_KEY);
  if (!rawData) {
    return [];
  }
  try {
    return JSON.parse(rawData);
  } catch (error) {
    // If the stored data is somehow corrupted, start fresh
    return [];
  }
}

/**
 * Saves a new submission to localStorage, keeping only the
 * most recent MAX_STORED_SUBMISSIONS entries, newest first.
 */
function saveSubmissionLocally(feedbackData) {
  const submissions = getStoredSubmissions();

  // Add a timestamp so we can show "when" it was submitted
  const newEntry = {
    name: feedbackData.name,
    category: feedbackData.category,
    rating: feedbackData.rating,
    message: feedbackData.message,
    submittedAt: new Date().toISOString(),
  };

  // Put the newest submission at the FRONT of the array
  submissions.unshift(newEntry);

  // Keep only the last 5 entries (remove anything older)
  const trimmedSubmissions = submissions.slice(0, MAX_STORED_SUBMISSIONS);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedSubmissions));

  // Refresh the list on screen immediately
  renderSubmissionsList();
}

/**
 * Turns a raw ISO timestamp into a friendly "time ago" string,
 * e.g. "Just now", "5 minutes ago", "2 hours ago".
 */
function formatTimeAgo(isoTimestamp) {
  const submittedDate = new Date(isoTimestamp);
  const secondsAgo = Math.floor((Date.now() - submittedDate.getTime()) / 1000);

  if (secondsAgo < 60) {
    return "Just now";
  }
  const minutesAgo = Math.floor(secondsAgo / 60);
  if (minutesAgo < 60) {
    return minutesAgo + (minutesAgo === 1 ? " minute ago" : " minutes ago");
  }
  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) {
    return hoursAgo + (hoursAgo === 1 ? " hour ago" : " hours ago");
  }
  const daysAgo = Math.floor(hoursAgo / 24);
  return daysAgo + (daysAgo === 1 ? " day ago" : " days ago");
}

/**
 * Escapes special HTML characters so user-typed text can never
 * accidentally be treated as HTML/JavaScript when we insert it
 * into the page. This is a basic security best practice.
 */
function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Renders the current list of stored submissions into the
 * <ul id="postsList"> element in the HTML.
 */
function renderSubmissionsList() {
  const submissions = getStoredSubmissions();

  // Clear whatever is currently shown
  postsList.innerHTML = "";

  if (submissions.length === 0) {
    postsList.innerHTML = '<li class="empty-state">No submissions yet. Be the first to share your feedback!</li>';
    return;
  }

  submissions.forEach(function (entry) {
    const listItem = document.createElement("li");

    listItem.innerHTML =
      "<strong>" + escapeHTML(entry.name) + " — " + escapeHTML(entry.category) + " (Rating: " + entry.rating + "/5)</strong>" +
      escapeHTML(entry.message) +
      '<span class="post-meta">' + formatTimeAgo(entry.submittedAt) + "</span>";

    postsList.appendChild(listItem);
  });
}

// Render the list immediately when the page first loads,
// so any submissions from previous visits are shown right away.
renderSubmissionsList();

/* ----------------------------------------------------------
   8. SAMPLE POSTS FROM API (GET Request — Bonus Requirement)

   This section fetches the latest 5 posts from JSONPlaceholder
   using a GET request and displays them. This is separate from
   "Recent Submissions" above (which shows the user's own real
   data via localStorage). This section exists specifically to
   demonstrate the GET + fetch + display requirement using the API.
   ---------------------------------------------------------- */

const loadPostsBtn = document.getElementById("loadPostsBtn");
const apiPostsList = document.getElementById("apiPostsList");

async function loadLatestPosts() {
  loadPostsBtn.disabled = true;
  loadPostsBtn.textContent = "Loading...";
  apiPostsList.innerHTML = "";

  try {
    // GET request — fetch the latest 5 posts from the API
    const response = await fetch(API_URL + "?_limit=5");

    // Same rule applies here: fetch() does not throw on error status
    // codes, so we must check response.ok manually.
    if (!response.ok) {
      throw new Error("Server responded with status " + response.status);
    }

    const posts = await response.json();
    renderApiPosts(posts);

  } catch (error) {
    apiPostsList.innerHTML = '<li class="empty-state">Failed to load posts. Please try again.</li>';
    console.error("Fetch posts error:", error);

  } finally {
    loadPostsBtn.disabled = false;
    loadPostsBtn.textContent = "Load Latest Posts";
  }
}

/**
 * Renders the posts returned by the API into the apiPostsList element.
 */
function renderApiPosts(posts) {
  apiPostsList.innerHTML = "";

  posts.forEach(function (post) {
    const listItem = document.createElement("li");
    listItem.innerHTML =
      "<strong>#" + post.id + " — " + escapeHTML(post.title) + "</strong>" +
      escapeHTML(post.body);
    apiPostsList.appendChild(listItem);
  });
}

// Load the posts automatically when the page first opens
loadPostsBtn.addEventListener("click", loadLatestPosts);
document.addEventListener("DOMContentLoaded", loadLatestPosts);
