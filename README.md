# Node-RED HTMX Starter

A starter project for building web applications with [Node-RED](https://nodered.org/) and [HTMX](https://htmx.org/): pages and components are plain HTML files, business logic lives in Node-RED flows, and one subflow, `View`, turns them into HTML responses.

### Key Benefits

- **Low entry barrier** - the logic is a visual flow, the UI is plain HTML with HTMX attributes
- **Components** - reusable HTML files with nesting (`<TodoItem/>`), props (`<Card title="Tasks">`, `<TodoItem data="todos"/>`) and slots (`<Card>...</Card>`)
- **Real URLs** - every page has its own address; refresh, direct links and the back button work
- **Partial updates** - an action or a filter refreshes only the blocks it changed (`hx-select`, `hx-swap-oob`)
- **Form validation** - a `Validate` subflow with JSON rules, errors are shown next to the fields
- **Built-in cache** - templates are cached in memory and reloaded automatically when files change
- **Toasts, modal and loader** out of the box, no CSS framework required


## 📦 Quick Start

1. **Enable Node-RED projects** (recommended, not mandatory) in `settings.js`:
   ```javascript
   editorTheme: {
       projects: {
           enabled: true
       }
   }
   ```
2. **Move the editor away from `/`**, so the application can be served from the root:
   ```javascript
   httpAdminRoot: '/admin',
   ```
   All links in the templates are absolute (`/pages/...`, `/assets/...`), so `httpNodeRoot` must stay `/` (the default).
3. Restart Node-RED, then **Projects → New → Clone repository**:
   ```
   https://github.com/lab4prog/nodered-htmx-starter.git
   ```
4. **Check the project path.** Files are read relative to the global environment variable `PROJECT_PATH` (menu → **Settings → Environment**):
   ```
   PROJECT_PATH = ./data/projects/nodered-htmx-starter
   ```
   It is resolved from the working directory of the Node-RED process. If your project lives elsewhere, change it and the path in the **watch** node of the *Bootstraping* group.
5. Open `http://your-nodered-address/`.


## 🧭 How It Works

Every endpoint is a short flow:

```
HTTP IN → business logic (fills msg) → View subflow → HTTP Response
```

- **Business logic** is ordinary Node-RED nodes: function, database, HTTP request... It puts data into `msg` (e.g. `msg.todos`) and optionally a toast (`msg.notification`).
- **View** loads an HTML file, resolves the components inside it and renders the result with Mustache using `msg` as data.

The same endpoint serves two kinds of requests. `View` decides by the `HX-Request` header:

| Request | Response |
|---|---|
| HTMX (menu click, button, form) | only the rendered page or component |
| Direct (address bar, refresh, shared link) | the layout `index.html` with the page placed into its `<slot/>` |


## 📁 Project Structure

```
nodered-htmx-starter/
├── flows.json               # Starter tab (endpoints) + View and Validate subflows
├── flows_cred.json
├── package.json
└── public/
    ├── index.html           # Layout: menu, <slot/> for pages, loader, toasts, modal, HTMX
    ├── assets/
    │   ├── main.js          # Active menu, toasts, modal
    │   └── style.css        # Card, ToDo, modal, toasts, loader
    ├── pages/               # Pages: name = file name (subfolders allowed)
    │   ├── home.html
    │   ├── todo.html
    │   └── contacts.html
    └── components/          # Components: <Name/> = Name.html
        ├── Card.html        # Card: title prop + <slot>
        ├── Todo.html        # Task list (#todo-list)
        ├── TodoFilter.html  # All / Active / Done (#todo-filter)
        ├── TodoItem.html    # One task (data="todos"): toggle, edit, delete
        ├── TodoForm.html    # Create / edit form for the modal
        └── TodoUpdate.html  # Response of the ToDo actions: list + counter (hx-swap-oob)
```

### Starter tab

| Group / endpoint | Purpose |
|---|---|
| *Bootstraping*: `GET /` | Home page (`View`: Page `home`) |
| *Bootstraping*: `GET /assets/:filename` | Static files from `public/assets`. Only plain file names are served (`style.css`), anything else (`..%2F`, `.hidden`) → 404 |
| *Bootstraping*: `watch` + `inject` → `clearCache` | Clears the template cache on any change in `public` (recursive) or by the inject button |
| *Bootstraping*: `catch` → `errorResponse` | Errors in endpoint logic on this tab → `500 Server error` (see [Errors](#errors)) |
| `GET /pages/home`, `/pages/todo`, `/pages/contacts` | Pages |
| *ToDo* | CRUD example: create, edit, toggle, delete, filter - see [ToDo example](#-todo-example) |


## 🧱 The `View` Subflow

| Field | Default | Description |
|---|---|---|
| **Type** | `page` | select: **Page** (`public/pages`) or **Component** (`public/components`) |
| `name` | `index` | file name without `.html`, subfolders allowed: `operations/transactions` (can also come from `msg.name`). Only letters, digits, `_`, `-` and `/` - no `..` |
| `layout` | `index` | layout file in `public` used for direct requests |
| `maxRecursion` | `10` | protection from infinite component nesting |

What happens inside:

1. Load the file - from the cache or from disk
2. Direct (non-HTMX) request: load the layout and put the file into its `<slot/>`
3. Find component tags (`<Name/>`), load `components/Name.html` for each one and put them in place with their props and slot content - in the layout too, so it can use components like `<Navbar/>`
4. Repeat step 3 for nested components (up to `maxRecursion` passes)
5. Render everything once with **Mustache** using `msg` as data
6. Add the `HX-Trigger` header for a toast if `msg.notification` is set

### Errors

A request never hangs on an error, it gets a `500`:

| Where the error happens | Caught by | Response |
|---|---|---|
| inside `View` (missing page/component file, `maxRecursion` exceeded) | `catch` inside `View` | `500 Render error` |
| in endpoint logic on the Starter tab (function, DB query, ...) | `catch` in the *Bootstraping* group | `500 Server error`, `404 Not found` for a missing file |

Errors handled by `catch` are not logged by Node-RED, so both handlers write the error text to the log as a warning. The tab handler skips errors that are not part of an HTTP request (e.g. in `seedTodos`) and requests that were already answered.

> The `HTTP Response` nodes must not have a fixed status code, otherwise it overrides `msg.statusCode`.

**Cache.** Loaded files are kept in the global context variable `cache` (key - full path). The `watch` node clears it when anything in `public` changes, the `inject` button clears it manually.


## 🧩 Templates

### Components

A tag whose name **starts with a capital letter** is a component:

```html
<!-- components/Todo.html -->
<ul id="todo-list" class="todo-list">
    <TodoItem data="todos"/>
</ul>
```

- the tag name must match the file name exactly, including case: `<TodoItem/>` → `components/TodoItem.html` (on Linux file names are case-sensitive);
- lowercase tags (`<div>`, `<ul>`, `<slot>` …) are ordinary HTML.

### Props

Attributes of a component tag are its **props**:

| Attribute | Meaning | Inside the component |
|---|---|---|
| `title="Tasks"` | a static string | `{{title}}`, `{{#title}}...{{/title}}` |
| `compact` (no value) | `true` | `{{#compact}}...{{/compact}}` |
| `data="todos"` | the context: `msg.todos` (any path, e.g. `user.address`) | the fields of that object: `{{id}}`, `{{title}}` |

`data` works like a Mustache section: an **object** renders the component once with that object, an **array** renders it for every item, an empty value or empty array renders nothing:

```html
<!-- components/Todo.html -->
<TodoItem data="todos"/>
```
```html
<!-- components/TodoItem.html - one task, no loop inside -->
<li class="todo-item {{#done}}completed{{/done}}">
    <span class="title">{{title}}</span>
</li>
```

Static props:

```html
<!-- pages/todo.html -->
<Card title="Tasks">
    <Todo/>
</Card>
```
```html
<!-- components/Card.html -->
<section class="card">
    {{#title}}<h2 class="card-title">{{title}}</h2>{{/title}}
    <slot>Nothing here yet</slot>
</section>
```

The same component can be used several times with different props on one page.

**Lookup order.** A value is looked up in the `data` item first, then in the props, then in `msg` - so a component still sees the rest of the page data (`{{activeCount}}`, `{{filter.all}}`).

> Values are plain strings - `title="{{user.name}}"` is **not** evaluated. Use `data="user"` and `{{name}}` inside the component for dynamic values.
>
> Slot content sits inside the component, so it sees the component's props too: if the component has a `title` prop, `{{title}}` in the slot content shows the prop.

How it is done: `View` wraps the inserted component in Mustache sections - `{{#_props.p1}}{{#todos}}...{{/todos}}{{/_props.p1}}`, with the static props stored in `msg._props` - and the single Mustache render does the rest.

### Slots

Like in Vue or Svelte, a component can declare a `<slot>`. The content between the component's tags goes there:

| Usage | Result |
|---|---|
| `<Card><Todo/></Card>` | `<Todo/>` goes into the slot (and is resolved on the next pass) |
| `<Card/>` or `<Card></Card>` | the fallback is used: `Nothing here yet` |
| `<slot/>` without fallback | the slot is removed when no content is given |

The layout works the same way: `index.html` has `<main id="main"><slot/></main>` and the page goes into that slot. Another layout (e.g. without the menu for a login page) is another file in `public` selected with the `layout` field.

Limitations: one slot per component (no named slots yet); a component nested inside itself (`<Card><Card>...</Card></Card>`) is not supported.

### Data: Mustache

`msg` is the data for [Mustache](https://mustache.github.io/mustache.5.html). Values are HTML-escaped (`{{title}}`), so user input is safe to output. `{{#list}}...{{/list}}` repeats for arrays and shows for truthy values, `{{^list}}...{{/list}}` shows for empty / false values:

```html
<!-- components/Todo.html -->
<ul id="todo-list" class="todo-list">
    <TodoItem data="todos"/>
    {{^todos}}<li class="empty">No tasks</li>{{/todos}}
</ul>
```

Use `{{! comment }}` for comments that should not reach the browser.


## 📄 Pages and Navigation

**Adding a page:**
1. Create `public/pages/about.html`
2. Add `HTTP IN` (`GET /pages/about`) → [business logic] → `View` (Page, `about`) → `HTTP Response`
3. Add a link to the menu in `index.html`:
   ```html
   <a href="/pages/about" hx-get="/pages/about" hx-target="#main" hx-push-url="true">About</a>
   ```

`hx-push-url` puts the page address into the address bar, `href` keeps the link working without JavaScript. The menu link matching the current URL is highlighted automatically.

`index.html` sets `historyRestoreAsHxRequest: false` in `htmx-config`: when HTMX restores history from the server (back button with an empty history cache), it requests the full page instead of a fragment.


## 🔄 Updating Part of a Page

There are three tools, and the ToDo page uses all of them.

### 1. An action returns the block it changed

The endpoint renders only a component (`View` with type **Component**), and HTMX replaces that block:

```html
<form hx-post="/todos" hx-target="#todo-list" hx-swap="outerHTML">...</form>
```
```
HTTP IN (POST /todos) → createTodo → View (Component, Todo) → HTTP Response
```

Use it for actions: create, update, delete.

### 2. `hx-select` takes the block from the page

For filters and pagination you don't need a separate endpoint: request **the page** with new parameters and let HTMX take only the needed block from the response:

```html
<div id="todo-filter" hx-target="#todo-list" hx-select="#todo-list" hx-select-oob="#todo-filter"
     hx-swap="outerHTML" hx-push-url="true">
    <a href="/pages/todo?filter=active" hx-get="/pages/todo?filter=active">Active</a>
    ...
</div>
```

- the page endpoint reads the parameters from `msg.req.query` and renders the page;
- `hx-select="#todo-list"` takes the list from the response, `hx-target` + `hx-swap="outerHTML"` replace it;
- `hx-select-oob="#todo-filter"` takes **one more block** from the same response and swaps it by `id` - here the filter itself, to move the highlight to the clicked link. Several ids can be listed: `hx-select-oob="#a, #b"`;
- `hx-push-url="true"` puts the parameters into the address bar (`/pages/todo?filter=active`) - such a link can be shared or refreshed with F5, and the same endpoint returns the full page with the filter applied;
- `hx-*` attributes are inherited, so they are set once on the parent element.

The same pattern works for a table with filters and pagination: one page endpoint, the filter form and the pagination links with `hx-select="#table-id"`.

> The server renders the whole page on every request. That is cheap for templates, but heavy queries that the page needs only for other blocks (e.g. filter options from the DB) run every time too.

### 3. `hx-swap-oob`: the server updates one more block

When an action changes something outside the target block (a counter in the title, a badge in the menu), the response can carry that block with `hx-swap-oob`. HTMX swaps it by `id`, wherever it is on the page:

```html
<!-- components/TodoUpdate.html - response of the ToDo actions -->
<Todo/>
<small id="todo-count" hx-swap-oob="innerHTML">{{activeCount}} active</small>
```

```html
<!-- pages/todo.html -->
<h1>ToDo <small id="todo-count" class="todo-count">{{activeCount}} active</small></h1>
```

`<Todo/>` goes into `hx-target` as usual, the counter replaces the content of `#todo-count` in the title. `innerHTML` keeps the element itself (and its `class`) from the page.

> Put `hx-swap-oob` only into **action responses**, not into page templates: a page loaded through the menu is an HTMX response too, and HTMX would cut such an element out of the page.

| Tool | Who decides what to update | Use for |
|---|---|---|
| `hx-target` + component response | the element that sends the request | an action that changes one block |
| `hx-select` / `hx-select-oob` | the element, picking blocks from the page response | filters, pagination, tabs |
| `hx-swap-oob` | the server | an action that also changes blocks elsewhere |


## ✅ ToDo Example

A small CRUD in the *ToDo* group. Tasks live in the global context variable `todos` (in memory: an `inject` on start adds two tasks, everything is reset when Node-RED restarts).

| Endpoint | Function | Response | Toast |
|---|---|---|---|
| `GET /pages/todo?filter=` | `todos` | page `todo` | - |
| `GET /todos/:id/edit` | `editTodo` | component `TodoForm` (into the modal) | Task not found |
| `POST /todos` | `Validate` → `createTodo` | component `TodoUpdate` (422: `TodoForm` with errors) | Task created |
| `PUT /todos/:id` | `Validate` → `updateTodo` | component `TodoUpdate` (422: `TodoForm` with errors) | Task updated |
| `PATCH /todos/:id/toggle` | `toggleTodo` | component `TodoUpdate` | Task completed / reopened |
| `DELETE /todos/:id` | `deleteTodo` | component `TodoUpdate` | Task deleted |

The four actions only change the data and set the toast. They are all wired into **one shared tail** - several wires can go into one node, and one `HTTP Response` serves them all because every `msg` carries its own `msg.res`:

```
createTodo ─┐
updateTodo ─┤
toggleTodo ─┼─► link call filterTodos ─► View (Component, TodoUpdate) ─► HTTP Response
deleteTodo ─┘
```

Components of the page:

| Component | Content |
|---|---|
| `TodoFilter` (`#todo-filter`) | links **All / Active / Done** - [tool 2](#2-hx-select-takes-the-block-from-the-page) |
| `Todo` (`#todo-list`) | the list: `<TodoItem data="todos"/>` renders one `TodoItem` per task |
| `TodoItem` | checkbox (toggle), Edit (modal), Delete |
| `TodoForm` | one form for create and edit: without `msg.form.id` it sends `POST /todos`, with it - `PUT /todos/:id`; shows `msg.errors` |
| `TodoUpdate` | response of the actions: `Todo` + the counter with `hx-swap-oob` - [tool 3](#3-hx-swap-oob-the-server-updates-one-more-block) |

`filterTodos` is a subroutine (`link in` → function → `link out` in return mode) called with **link call** from the shared tail and from the page endpoint. It counts active tasks (`msg.activeCount`) and filters the list. A page request takes the filter from its own URL (`?filter=done`), an action takes it from the page it was sent from (the `HX-Current-URL` header HTMX sends with every request). So completing a task on the *Active* tab removes it from the list.

```javascript
// createTodo - the title is already validated and trimmed by Validate
const todos = global.get("todos") || [];

const id = todos.reduce((max, t) => Math.max(max, t.id), 0) + 1;
todos.push({ id, title: msg.payload.title, done: false });
global.set("todos", todos);
msg.notification = { message: "Task created", type: "success" };

msg.todos = todos;
return msg;
```


## 🛡 Form Validation

The `Validate` subflow checks `msg.payload` before the business logic. It has two outputs:

```
                     ┌ valid ──► business logic ─► ...
HTTP IN ─► Validate ─┤
                     └ invalid ► View (Component, the form) ─► HTTP Response   (422)
```

Rules are set as JSON in the **Rules** field of the node:

```json
{ "title": { "label": "Title", "required": true, "maxLength": 100 } }
```

| Rule | Meaning |
|---|---|
| `required` | the value must not be empty (values are trimmed) |
| `minLength`, `maxLength` | length limits |
| `pattern` + `message` | a regular expression and the error text for it |
| `label` | field name used in the messages (`Title is required`) |

- **valid**: `msg.payload` with trimmed values goes on to the business logic;
- **invalid**: `msg.errors = { title: "Title is required" }`, `msg.form` = submitted values + route params (`id`), `msg.statusCode = 422`. The second output goes to a `View` that renders the form again.

The form shows the errors and keeps the entered values:

```html
<input name="title" value="{{form.title}}" class="{{#errors.title}}invalid{{/errors.title}}">
{{#errors.title}}<div class="field-error">{{errors.title}}</div>{{/errors.title}}
```

On the client a `422` response **replaces the form that sent the request** instead of the usual `hx-target` (`main.js`, `htmx:beforeSwap`). HTMX does not swap 4xx responses by default, so this one handler makes it work for any form: the modal stays open, the list is not touched. The modal closes only on a `2xx` response.

In the ToDo example `POST /todos` and `PUT /todos/:id` go through `Validate`, and both invalid outputs share one `View (TodoForm)` → `HTTP Response`.


## 🔔 UI Helpers (`main.js` + `style.css`)

`index.html` keeps Bootstrap-like class names for the toast templates, but no CSS framework is loaded - everything is styled in `style.css`.

### Toasts

Set `msg.notification` before `View`:

```javascript
msg.notification = { message: "Task saved", type: "success" }; // success | error | info
```

`View` adds the `HX-Trigger: showToast` header, `main.js` shows the toast for 3 seconds (it can be closed with ×).

### Modal

`#Modal` opens:
- by a button with `data-modal-component="<id>"` - the contents of the element with that `id` (usually a `<template>`) are copied into `#ModalContent`:
  ```html
  <button data-modal-component="todo-create">+ New task</button>
  <template id="todo-create"><TodoForm/></template>
  ```
- after any HTMX request with `hx-target="#ModalContent"`:
  ```html
  <button hx-get="/todos/1/edit" hx-target="#ModalContent">Edit</button>
  ```

It closes after a `2xx` response to an HTMX request sent from inside the modal (e.g. form submit; a `422` with validation errors keeps it open), by a `[data-modal-close]` button, a click on the backdrop or `Escape`.

### Loader

During every HTMX request a full-screen overlay `#indicator` dims and blurs the page and shows a spinner in the center (`<body hx-indicator="#indicator">` is inherited by all elements). It appears after 200 ms, so fast requests don't flicker. To check it, enable network throttling in the browser DevTools.

### Active menu

The `nav` link whose `href` matches the current URL gets the `active` class and `aria-current="page"` - on page load, after HTMX navigation and when going back in history.


## 📚 Useful Links

- [HTMX Documentation](https://htmx.org/docs/) and [examples](https://htmx.org/examples/)
- [`hx-select`](https://htmx.org/attributes/hx-select/), [`hx-select-oob`](https://htmx.org/attributes/hx-select-oob/), [`hx-swap-oob`](https://htmx.org/attributes/hx-swap-oob/), [`hx-push-url`](https://htmx.org/attributes/hx-push-url/)
- [Mustache syntax](https://mustache.github.io/mustache.5.html)
- [Node-RED Projects](https://nodered.org/docs/user-guide/projects/)
