<div>

# 🖼️ Pictorium UI

**Pinterest‑inspired web application built with React 19, Vite & TypeScript**

A feature‑rich, responsive UI supporting pin feeds, boards, search,
recommendations, notifications, real‑time chat, and Keycloak authentication.

Backend — [pictorium](https://github.com/tishembitov/pictorium)

</div>

---

## ✨ Features

| Area                   | Details                                                                       |
|------------------------|-------------------------------------------------------------------------------|
| **Feed & Trending**    | Home page with a curated masonry feed and a dedicated "Trending" section      |
| **Boards**             | Create boards and choose a target board when saving a pin                     |
| **Create & Edit Pins** | Upload images, add title / description / tags, assign to boards               |
| **Search**             | Global search with a debounced suggestion popover and instant results         |
| **Recommendations**    | "More like this" block on the pin detail page driven by similar tags / boards |
| **Notifications**      | Full notifications page + lightweight header popover                          |
| **Chat**               | Direct messages with a conversations list and real‑time presence indicator    |
| **User Profile**       | Created & saved pins, boards, followers / following lists, profile settings   |
| **Authentication**     | Keycloak integration, private routes, protected actions                       |

---

## 🛠 Tech Stack

- **React 19** · **React Router** — UI framework & routing
- **Vite** — build tool & dev server
- **TypeScript** — type safety
- **Zustand** — lightweight client state management
- **@tanstack/react-query** — server state, caching & API calls
- **Gestalt** — UI component library
- **Keycloak** — authentication & authorization

---

## 🚀 Getting Started

### Prerequisites

| Tool            | Version                   |
|-----------------|---------------------------|
| Node.js         | ≥ 18                      |
| npm             | ≥ 9                       |
| Keycloak server | configured realm & client |

### Installation

```bash
# clone the repo
git clone https://github.com/<your-org>/pictorium-ui.git
cd pictorium-ui

# install dependencies
npm install
```

### Development

```bash
npm run dev          # start dev server → http://localhost:5173
```

### Production

```bash
npm run build        # create optimised production build
npm run preview      # preview the production build locally
```

> **Note:** for authentication to work you need a running Keycloak instance and matching environment variables (realm, client ID, base URL, etc.).

---

## 📁 Project Structure

```
src/
├── app/             # Root App component, router, providers
├── pages/           # Top‑level route pages
│   ├── HomePage
│   ├── ExplorePage
│   ├── PinDetailPage
│   ├── SearchPage
│   ├── NotificationsPage
│   └── ...profile, settings, etc.
├── modules/         # Domain modules
│   ├── pin/
│   ├── board/
│   ├── search/
│   ├── notification/
│   ├── chat/
│   ├── user/
│   ├── auth/
│   ├── storage/
│   └── explore/
└── shared/          # Shared components, hooks, utilities, stores
```

---

## 📸 Screenshots

### Authentication

<details>
<summary><b>Keycloak login</b></summary>

Login & register form used to authenticate users before accessing protected routes (pin creation, editing, notifications, messages).

![Keycloak](images/keycloak.png)

</details>

---

### Navigation & Layout

<details>
<summary><b>Home feed</b></summary>

Main masonry feed of pins tailored to the user.

![Home](images/home.jpg)

</details>

<details>
<summary><b>Trending</b></summary>

Highlights currently popular pins to help users discover hot content.

![Trending](images/trending.jpg)

</details>

<details>
<summary><b>Explore page</b></summary>

Topic‑based feeds and carousels for passive discovery of new pins and boards.

![Explore](images/explore.jpg)

</details>

<details>
<summary><b>Search page</b></summary>

Results for a query across pins / boards / users with filters.

![Search](images/search.jpg)

</details>

<details>
<summary><b>Search popover</b></summary>

Inline suggestion popover in the header with debounced suggestions and recent search history.

![Search popover](images/searchPopover.jpg)

</details>

---

### Content & Boards

<details>
<summary><b>Create pin</b></summary>

Form for uploading an image, adding title / description / tags and assigning the pin to a board.

![Create pin](images/createPin.jpg)

</details>

<details>
<summary><b>Pin detail</b></summary>

Large image view with description, board, comments, and save / like actions.

![Pin detail](images/pinDetail.jpg)

</details>

<details>
<summary><b>More like this</b></summary>

Recommendation block below the main pin, built from similar tags / boards to drive further engagement.

![More like this](images/more.jpg)

</details>

<details>
<summary><b>Save pin flow</b></summary>

Choose an existing board or create a new one.

|           Save dialog           |             Board selector              |        Saved confirmation         |
|:-------------------------------:|:---------------------------------------:|:---------------------------------:|
| ![Save pin](images/savePin.jpg) | ![Select board](images/boardSelect.jpg) | ![Pin saved](images/pinSaved.jpg) |

</details>

<details>
<summary><b>Boards</b></summary>

|            Boards list            |              Create board               |
|:---------------------------------:|:---------------------------------------:|
| ![Boards list](images/boards.jpg) | ![Create board](images/createBoard.jpg) |

</details>

---

### Notifications & Chat

<details>
<summary><b>Notifications</b></summary>

|                 Full page                  |                  Popover                   |           Single card            |
|:------------------------------------------:|:------------------------------------------:|:--------------------------------:|
| ![Notifications](images/notifications.jpg) | ![Popover](images/notificationPopover.jpg) | ![Card](images/notification.jpg) |

</details>

<details>
<summary><b>Chat</b></summary>

Real‑time conversations list with presence indicators and message history.

![Chat](images/chat.jpg)

</details>

---

### Profile & Social

<details>
<summary><b>User profile</b></summary>

Created pins, saved pins, boards, profile header and bio.

![User profile](images/userProfile.jpg)

</details>

<details>
<summary><b>Followers / Following</b></summary>

|             Followers             |             Following              |
|:---------------------------------:|:----------------------------------:|
| ![Followers](images/follower.jpg) | ![Following](images/following.jpg) |

</details>

<details>
<summary><b>User settings</b></summary>

Update profile details, social links and preferences.

![User settings](images/userSettings.jpg)

</details>

---

<div>

Made with ❤️ using React & Vite

</div>

