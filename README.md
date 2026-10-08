# Node-RED HTMX Starter

A starter project for rapid web application development using Node-RED and HTMX with a component architecture.

## 🚀 Concept

**Node-RED HTMX Starter** is a low-code solution for creating interactive web applications without writing complex JavaScript. The project combines Node-RED visual programming, [HTMX](https://htmx.org/) and its own server-side component system built on Node-RED subflows.

### Key Benefits

- **Low entry barrier** - build web applications visually
- **Component architecture** - reusable HTML components with nesting (`<TodoItem/>`)
- **Rapid development** - from idea to working application in minutes
- **No complex JavaScript** - interactivity via HTMX attributes
- **Built-in cache** - templates are cached in memory and invalidated automatically on file changes
- **Toasts, modal and loader** out of the box


## 📦 Installation and Deployment

### Step 1: Node-RED Projects Setup

Using Node-RED projects is recommended (not mandatory).

In your Node-RED `settings.js` enable project support:

```javascript
editorTheme: {
    projects: {
        enabled: true
    }
}
```

### Step 2: Creating a Project

1. Restart Node-RED
2. In the Node-RED main menu select **"Projects" → "New"**
3. Choose **"Clone repository"**
4. Specify the repository URL:
```
https://github.com/lab4prog/nodered-htmx-starter.git
```
5. Enter the project name and click **"Clone project"**

### Step 3: Configure the project path

All files are read from disk relative to the global environment variable **`PROJECT_PATH`** (Node-RED menu → **Settings → Environment**, global config):

```
PROJECT_PATH = ./data/projects/nodered-htmx-starter
```

The path is resolved relative to the working directory of the Node-RED process. Adjust it if your user directory or project name differs.

Also update the path in the **watch** node of the *Bootstraping* group (`./data/projects/nodered-htmx-starter/public`) so cache invalidation keeps working.

### Step 4: Running the Application

After deploy, the application is available at the root of the Node-RED HTTP endpoints:

```
http://your-nodered-address/
```

If `httpNodeRoot` is set in `settings.js` (e.g. `/ui`), the address will be `http://your-nodered-address/ui`.


## 📁 Project Structure

```
nodered-htmx-starter/
├── flows.json               # Node-RED flows (Starter tab + Page/Component subflows)
├── flows_cred.json          # Node-RED credentials
├── package.json             # Node-RED project settings
└── public/
    ├── index.html           # Main layout (nav, #main, loader, toasts, modal, HTMX)
    ├── assets/
    │   ├── main.js          # Active menu, toast notifications, modal components
    │   └── style.css        # Basic styles (incl. htmx-indicator)
    ├── pages/               # Pages, loaded into #main
    │   ├── home.html
    │   ├── todo.html
    │   └── contacts.html
    └── components/          # Components (file name = component name)
        ├── Todo.html
        └── TodoItem.html
```


## 🏗 Project Architecture

All flows are on the **Starter** tab.

### Bootstraping group

| Endpoint / node | Purpose |
|---|---|
| `GET /` (`mainLayout`) | Returns `public/index.html` - the main layout of the application |
| `GET /assets/:filename` | Serves static files from `public/assets` (css, js, png, jpg, jpeg, svg) |
| `watch` + `inject` → `clearCache` | Clears the template cache when anything in `public` changes, or manually via the inject button |

### Main layout `index.html`

Contains:
- navigation with HTMX links (`/pages/home` is loaded automatically on `load`);
- the `<main id="main">` container for pages;
- loader `#indicator` (class `htmx-indicator`);
- toast container `#toastPlacement` and `success` / `error` / `info` toast templates;
- modal `#Modal` with `#ModalContent`;
- HTMX 2.0.7 from CDN and `/assets/main.js`.

### Pages `/pages/<name>`

Each page has its **own HTTP endpoint** that ends with the **`Page`** subflow:

```
HTTP IN (/pages/todo) → [Business Logic] → Subflow Page (page: "todo") → HTTP Response
```

The `Page` subflow loads `public/pages/<page>.html`, resolves nested components and renders the result with Mustache using `msg` as data.

```html
<nav>
    <a href="#" hx-get="/pages/home" hx-trigger="load, click" hx-target="#main">Home</a>
    <a href="#" hx-get="/pages/todo" hx-target="#main">ToDo</a>
    <a href="#" hx-get="/pages/contacts" hx-target="#main">Contacts</a>
</nav>
<main id="main"></main>
```

**Adding a new page:**
1. Create `public/pages/about.html`
2. Add `HTTP IN` (`GET /pages/about`) → `Page` subflow (env `page` = `about`) → `HTTP Response`
3. Add a link with `hx-get="/pages/about"` to the navigation

### Components `/components/<name>`

A component can be:
- **embedded** in a page or another component with a tag (see below) - it is resolved on the server in the same request;
- **loaded separately** via its own endpoint ending with the **`Component`** subflow:

```
HTTP IN (/components/todo) → Business Logic → Subflow Component (mainComponent: "Todo") → HTTP Response
```

```html
<div id="todo" hx-get="/components/todo" hx-trigger="load"></div>
```


## 🧩 Component Tags - the magic of the Page / Component subflows

Inside any page or component you can insert another component with a tag whose name **starts with a capital letter**:

```html
<!-- public/components/Todo.html -->
<ul>
    <TodoItem/>
</ul>
```

Both forms are supported: `<TodoItem/>` and `<TodoItem>...</TodoItem>` (the content inside is ignored).

### How it works

1. The subflow loads the main file (page or component) - from the cache or from disk
2. It finds all tags matching `<[A-Z]...>` and loads `public/components/<TagName>.html` for each one
3. The tags are replaced with the file contents; the process repeats for nested components (up to `maxRecursion` levels)
4. The final HTML is rendered with **Mustache** using `msg` as data and returned

> ⚠️ The tag name must exactly match the file name, including case: `<TodoItem/>` → `components/TodoItem.html`. On Linux file names are case-sensitive.
>
> Lowercase tags (`<div>`, `<ul>` …) are ordinary HTML and are not touched.

### Subflow settings

| Subflow | Env variable | Default | Description |
|---|---|---|---|
| `Page` | `page` | `index` | page file name in `public/pages` (can also be passed in `msg.page`) |
| `Component` | `mainComponent` | `index` | component file name in `public/components` |
| both | `maxRecursion` | `10` | protection from infinite component nesting |

### Cache

Loaded files are stored in the global context variable `cache` (key - full file path). The cache is cleared:
- automatically by the `watch` node when files in `public` change;
- manually with the `inject` button in the *Bootstraping* group.


## 💼 Business Logic

**Important:** all business logic is placed **between the HTTP IN endpoint and the `Page` / `Component` subflow**.

```
HTTP Request → Business Logic → msg with data → Subflow Page/Component → HTML Response
```

### Example: `todo` component

1. **HTTP IN** `GET /components/todo`
2. **Function** `todos`:
```javascript
msg.todos = [
    { id: 1, title: "Buy milk", done: false },
    { id: 2, title: "Do your homework", done: true }
];
return msg;
```
3. **Subflow Component** (`mainComponent: "Todo"`)
4. **HTTP Response**

### Mustache Templating

The data from `msg` is substituted into the assembled template using [Mustache syntax](https://mustache.github.io/mustache.5.html):

```html
<!-- public/components/TodoItem.html -->
{{# todos}}
<li class="todo-item {{#done}}completed{{/done}}">
    <input type="checkbox" {{#done}}checked{{/done}}>
    <span>{{title}}</span>
</li>
{{/ todos}}
```


## 🔔 UI Helpers (`main.js`)

### Toast notifications

Set `msg.notification` in the business logic before the `Page` or `Component` subflow:

```javascript
msg.notification = { message: "Task saved", type: "success" }; // success | error | info
return msg;
```

The subflow adds an `HX-Trigger: showToast` response header, and `main.js` shows a toast from the matching template in `index.html` for 3 seconds.

### Modal components

A button with the `data-modal-component` attribute copies the contents of the element with that `id` (usually a `<template>`) into `#ModalContent` and processes it with HTMX:

```html
<button data-modal-component="edit-form">Edit</button>

<template id="edit-form">
    <form hx-post="/components/todo">...</form>
</template>
```

### Loader

Element `#indicator` with class `htmx-indicator` is shown while an HTMX request is in progress (see `style.css`). Point to it with `hx-indicator="#indicator"`.

### Active menu

Clicking `.navbar-nav .nav-link` moves the `active` class to the parent `.nav-item`.


## 📚 Useful Links

- [HTMX Documentation](https://htmx.org/docs/) - complete HTMX documentation
- [HTMX examples](https://htmx.org/examples/) - practical usage examples
- [Mustache Documentation](https://mustache.github.io/mustache.5.html) - template syntax
- [Node-RED Projects](https://nodered.org/docs/user-guide/projects/) - working with projects in Node-RED

***

**Created with ❤️**

This starter lets you build modern web applications without deep knowledge of frontend frameworks, using the power of visual programming and component architecture.
