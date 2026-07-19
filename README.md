# Feedback Form 

Live deploymnet: https://web-development-internship-task3.vercel.app/
##Features 

- Full client-side validation for all fields (name, email, category, rating, message), with inline error messages under each field
- No `alert()` and no page reloads — handled with `event.preventDefault()`
- Sends a `POST` request to a REST API with JSON headers and body
- Loading state: submit button is disabled, text changes to "Submitting...", and a spinner is shown
- Success state: shows a confirmation message with the submitted name and the ID returned by the API, then resets the form
- Error state: shows a friendly error message and keeps the user's input if the request fails
- Live character counter for the message field (0/500)
- Bonus: "Recent Submissions" list shows the last 5 real feedback entries submitted from this browser (saved using `localStorage`, so they persist even after refreshing the page)
- Fully responsive layout, tested at 375px (mobile) and 1280px (desktop) widths
- Accessible: every input has a connected `<label for>`, semantic HTML (`<fieldset>`, `<legend>`), and visible focus styles for keyboard users

## Technologies

- HTML5
- CSS3 (custom properties, flexbox, media queries)
- Vanilla JavaScript (ES6+, async/await, Fetch API, localStorage)

## API Used

[JSONPlaceholder](https://jsonplaceholder.typicode.com/posts) — a free fake REST API used only to simulate the `POST` request when the form is submitted. It does not actually save data permanently, which is why the "Recent Submissions" list is built using the browser's own `localStorage` instead of fetching data back from the API.

## Folder Structure

```
feedback-form/
├── index.html
├── style.css
├── script.js
└── README.md
```

## Screenshots
<img width="797" height="789" alt="image" src="https://github.com/user-attachments/assets/189e4fe1-c542-4762-a7cd-7b8b454f9986" />
<img width="856" height="890" alt="image" src="https://github.com/user-attachments/assets/4868c2fc-085b-4681-91d9-6390b4468e3f" />

## Challenges Faced

- Making sure a failed submission does not clear the user's typed data, while a successful one does
- Deciding how to show "recent submissions" in a way that reflects real user activity instead of unrelated placeholder data from the API
