# installing frontend deps:
```bash
npm install tw-animate-css

npm install -D tailwindcss@3 postcss autoprefixer

 
npm install next-themes
```

# Install backend dependencies
```bash
cd server

npm init -y

npm install express mongoose bcryptjs jsonwebtoken cors dotenv helmet express-rate-limit

npm install -D nodemon
```

# In a new terminal tab
```bash
cd .. # Go back to root directory
```
# Install frontend dependencies
```bash
npm install

npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

npm install react-markdown remark-gfm

npm install date-fns

npm install next-fonts


//if they show error, write next to them --legacy-peer-deps

Ex: npm install date-fns --legacy-peer-deps
```


# frontend:
```
npm run build && npm start (front end)
```
# Backend:
```
cd server
npm run dev
```

# .env file:
```
cd server

MONGODB_URI=mongodb://127.0.0.1:27017/notesapp

JWT_SECRET=replace-with-a-strong-secret

PORT=5000

NODE_ENV=development

CLIENT_URL=http://localhost:3000

GOOGLE_API_KEY=your-google-api-key-here

VAPID_PUBLIC_KEY=your-public-vapid-key

VAPID_PRIVATE_KEY=your-private-vapid-key

VAPID_EMAIL=you@example.com
```

# .env.local:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api

NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-vapid-key
```

Note: Do not put AI keys in .env.local. Keep GOOGLE_API_KEY only in server/.env.


# whats missing?

1) Ai assistant
2) drag and drop
3) calender viewing the note
4) upcoming reviews
5) whole review part
6) theme part (done)
7) the longer you study the plant grows
8) adding the color to the note as your choice
# suggestions:
1)whiteboard





