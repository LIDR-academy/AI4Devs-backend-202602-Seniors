# Frontend

## Stack

| Concern | Technology |
|---------|------------|
| Framework | React 18 |
| Language | JavaScript (`.js`) — TypeScript entry point only at `index.tsx` |
| UI components | React Bootstrap |
| Routing | React Router |
| HTTP | Axios (in service layer), `fetch` (in form component) |
| Date picker | react-datepicker |

---

## Entry Point

`frontend/src/index.tsx` renders `<App />` into `#root`.

`frontend/src/App.js` defines the route map (React Router). `App.tsx` is the CRA default boilerplate — unused.

---

## Directory Structure

```
frontend/src/
├── index.tsx                    # React DOM render
├── App.js                       # Root routing component
├── assets/
│   └── lti-logo.png
├── components/
│   ├── RecruiterDashboard.js    # Landing page with navigation
│   ├── AddCandidateForm.js      # Candidate creation form
│   └── FileUploader.js          # CV upload widget
└── services/
    └── candidateService.js      # All API calls abstracted here
```

---

## Service Layer

`frontend/src/services/candidateService.js` — all backend communication is abstracted into named export functions:

```javascript
export const uploadCV = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post('http://localhost:3010/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;  // { filePath, fileType }
};

export const sendCandidateData = async (candidateData) => {
    const response = await axios.post('http://localhost:3010/candidates', candidateData);
    return response.data;
};
```

**Pattern**: components call `uploadCV(file)` — not raw `axios.post(...)`. This keeps backend URL and HTTP details out of component code.

> Backend base URL (`http://localhost:3010`) is currently hardcoded. It should be extracted to an environment variable (`REACT_APP_API_URL`).

---

## Components

### RecruiterDashboard

`frontend/src/components/RecruiterDashboard.js`

Stateless functional component. Displays navigation links using React Router `<Link>`:

```javascript
const RecruiterDashboard = () => (
    <Container className="mt-5">
        <img src={logo} alt="LTI Logo" />
        <Link to="/add-candidate">
            <Button variant="primary">Añadir Nuevo Candidato</Button>
        </Link>
    </Container>
);
```

No local state, no API calls — pure UI navigation.

---

### AddCandidateForm

`frontend/src/components/AddCandidateForm.js`

Multi-section candidate form with local state management:

```javascript
const [candidate, setCandidate] = useState({
    firstName: '', lastName: '', email: '', phone: '', address: '',
    educations: [], workExperiences: [], cv: null
});
```

**Responsibilities**:
- Manages the full candidate form state in one `useState` object
- Dynamically adds/removes education and work experience entries
- Accepts CV upload result from `FileUploader` via callback
- Formats dates to `YYYY-MM-DD` (ISO string slice) before submitting
- Submits via `POST /candidates`, handles 201/400/500 status codes

**Date formatting before submit** (required by backend validator):

```javascript
candidateData.educations = candidateData.educations.map(edu => ({
    ...edu,
    startDate: edu.startDate ? edu.startDate.toISOString().slice(0, 10) : '',
    endDate:   edu.endDate   ? edu.endDate.toISOString().slice(0, 10)   : ''
}));
```

---

### FileUploader

`frontend/src/components/FileUploader.js`

Reusable file input widget. On file selection, calls `POST /upload` and returns `{ filePath, fileType }` to the parent via `onUpload` callback.

---

## State Management

No global state library. Each component manages its own state with React `useState`. Parent-child communication via props and callbacks.

---

## Routing

React Router (configured in `App.js`):

| Route | Component |
|-------|-----------|
| `/` | `RecruiterDashboard` |
| `/add-candidate` | `AddCandidateForm` |
