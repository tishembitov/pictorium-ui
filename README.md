<div>

# 🖼️ Pictorium UI

Pinterest‑like web application UI built with React and Vite. Supports pin feed, boards, search, recommendations, notifications, chat, and Keycloak‑based authentication.

> **Backend** — [pictorium](https://github.com/tishembitov/pictorium)

</div>

---

## ✨ Features

- **Feed & trending**: home page with a curated feed and a dedicated “Trending” section.
- **Boards**: create boards and choose a board when saving a pin.
- **Create & edit pins**: upload images, add descriptions and tags, save pins to boards.
- **Search**: global content search with a suggestion popover and instant results.
- **Recommendations**: “More like this” section on the pin detail page.
- **Notifications**: notifications list and a quick popover.
- **Chat**: direct messages with a conversations list and presence indicator.
- **User profile**: created and saved pins, boards, followers/following lists, profile settings.
- **Authentication**: Keycloak integration, private routes, protected actions (create/edit).

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

```bash
# install dependencies
npm install

# start dev server
npm run dev

# build for production
npm run build

# preview production build
npm run preview
```

By default, Vite serves the app at `http://localhost:5173` (you can change the port in Vite config).

For authentication to work, you need a configured Keycloak server and matching environment variables (realm, client id, base URL, etc.).

---
## 📸 Screenshots

### Authentication

#### Keycloak login

Login & register form used to authenticate users before accessing protected routes (pin creation, editing, notifications, messages).

![Keycloak](images/keycloak.png)

---

### Navigation & Layout

#### Home feed

Main masonry feed of pins tailored to the user.

![Home](images/home.jpg)

#### Trending

Highlights currently popular pins to help users discover hot content.

![Trending](images/trending.jpg)

#### Explore page

Topic‑based feeds and carousels for passive discovery of new pins and boards.

![Explore](images/explore.jpg)

#### Search page

Results for a query across pins / boards / users with filters.

![Search](images/search.jpg)

#### Search popover

Inline suggestion popover in the header with debounced suggestions and recent search history.

![Search popover](images/searchPopover.jpg)

---

### Content & Boards

#### Create pin

Form for uploading an image, adding title / description / tags and assigning the pin to a board.

![Create pin](images/createPin.jpg)

#### Pin detail

Large image view with description, board, comments, and save / like actions.

![Pin detail](images/pinDetail.jpg)

#### More like this

Recommendation block below the main pin, built from similar tags / boards to drive further engagement.

![More like this](images/more.jpg)

#### Save pin flow

Choose an existing board or create a new one.

|           Save dialog           |             Board selector              |        Saved confirmation         |
|:-------------------------------:|:---------------------------------------:|:---------------------------------:|
| ![Save pin](images/savePin.jpg) | ![Select board](images/boardSelect.jpg) | ![Pin saved](images/pinSaved.jpg) |

#### Boards

|            Boards list            |              Create board               |
|:---------------------------------:|:---------------------------------------:|
| ![Boards list](images/boards.jpg) | ![Create board](images/createBoard.jpg) |

---

### Notifications & Chat

#### Notifications

|                 Full page                  |                  Popover                   |           Single card            |
|:------------------------------------------:|:------------------------------------------:|:--------------------------------:|
| ![Notifications](images/notifications.jpg) | ![Popover](images/notificationPopover.jpg) | ![Card](images/notification.jpg) |

#### Chat

Real‑time conversations list with presence indicators and message history.

![Chat](images/chat.jpg)

---

### Profile & Social

#### User profile

Created pins, saved pins, boards, profile header and bio.

![User profile](images/userProfile.jpg)

#### Followers / Following

|             Followers             |             Following              |
|:---------------------------------:|:----------------------------------:|
| ![Followers](images/follower.jpg) | ![Following](images/following.jpg) |

#### User settings

Update profile details, social links and preferences.

![User settings](images/userSettings.jpg)

<div>

Made with ❤️ using React & Vite

</div>

