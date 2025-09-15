# Node-RED HTMX Starter

A starter project for rapid web application deployment using Node-RED and HTMX with component architecture.

## 🚀 Concept

**Node-RED HTMX Starter** is a low-code solution for creating interactive web applications without writing complex JavaScript code. The project combines visual programming of Node-RED with the power of HTMX and its own component system.

### Key Benefits

- **Low entry barrier** - create web applications visually
- **Component architecture** - modular development with reuse
- **Rapid development** - from idea to ready application in minutes
- **No complex JavaScript** - use HTMX attributes


## 📦 Installation and Deployment

### Step 1: Node-RED Projects Setup

To work with the repository, it's recommended to use projects in Node-RED (not mandatory).

In your Node-RED installation's `settings.js` file, enable project support:

```javascript
projects: {
    enabled: true
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

5. Enter project name and click **"Clone project"**

### Step 3: Running the Application

After successful import, the project will be available at:

```
http://your-nodered-address/ui
```


## 🏗 Project Architecture

### Entry Point `/ui`

When a user navigates to this link, the main static file `index.html` from the `public` folder is loaded. This is the main page of your application with basic markup and HTMX connection.
### Pages `/pages/:page`

Endpoint for loading main static pages from the `pages` folder.

**Working logic:**

1. HTMX sends request to `/pages/page_name`
2. Node-RED finds corresponding HTML file in `pages` folder
3. Content is substituted in place specified by `hx-target` attribute

**Usage example:**

```html
<nav>
    <a hx-get="/pages/home" hx-target="#content">Home</a>
    <a hx-get="/pages/contacts" hx-target="#content">Contacts</a>
</nav>
<div id="content">[Content will be loaded here]</div>
```


### Components `/components/:component_name`

For each main component, a **separate endpoint** with its own business logic is created. Component flow **must** end with `Component` subflow with specified component name.

**Component structure:**

```
HTTP IN (/components/todo) → Business Logic → Subflow Component → HTTP Response
```

**Calling component on page:**

```html
<div hx-get="/components/todo_list" 
     hx-target="#todo-container" 
     hx-trigger="load">
</div>
```


## 🧩 Subcomponents - Main Magic of Subflow Component

**Subflow Component** is the heart of the system that implements component architecture.

### How the component system works:

1. **Special HTML tag** in component files:
```html
<!-- In file components/todo_list.html -->
<ul class="todo-list">
    <component>todo_item</component>
</ul>
```

2. **Automatic replacement** - Subflow finds `<component>name</component>` tags and replaces them with real HTML markup from `components` folder
3. **Result** after processing:
```html
<ul class="todo-list">
    <li class="todo-item">Buy milk</li>
    <li class="todo-item">Do homework</li>
</ul>
```


### Subflow Component Configuration:

- **mainComponent**: name of main component to load
- **maxRecursion**: 10 (protection from infinite recursion)


## 💼 Business Logic

**Important:** All business logic must be placed **between component endpoint and subflow Component**.

### Data flow:

```
HTTP Request → Business Logic → Ready JSON → Subflow Component → HTML Response
```


### Example flow for `todo_list` component:

1. **HTTP IN** (`/components/todo_list`)
2. **Function** (loading data from DB)
```javascript
// Business logic example
msg.todos = [
    { id: 1, title: "Buy milk", done: false },
    { id: 2, title: "Do homework", done: true }
];
return msg;
```

3. **Subflow Component** (mainComponent: "todo_list")
4. **HTTP Response**

### Mustache Templating

Ready JSON is sent to component, which is substituted into template using [Mustache syntax](https://mustache.github.io/mustache.5.html):

```html
<!-- components/todo_item.html -->
{{# todos}}
<li class="todo-item {{#done}}completed{{/done}}">
    <input type="checkbox" {{#done}}checked{{/done}}>
    <span>{{title}}</span>
</li>
{{/ todos}}
```


## 📚 Useful Links

- [HTMX Documentation](https://htmx.org/docs/) - complete HTMX documentation
- [Mustache Documentation](https://mustache.github.io/mustache.5.html) - template syntax
- [HTMX attributes and examples](https://htmx.org/examples/) - practical usage examples

***

**Created with ❤️**

This starter allows creating modern web applications without deep knowledge of frontend frameworks, using the power of visual programming and component architecture.