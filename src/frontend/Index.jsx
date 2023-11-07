import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Frontpage from './components/Frontpage.jsx'
import Game from './components/Game.jsx'

class App extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            channel: '',
            config: {},
        }
    }

    // if missing config, show config window

    render() {
        return (
            <BrowserRouter basename='/'>
                <Routes>
                    <Route exact path="/" element={<Frontpage />} />
                    <Route exact path="/:channel" element={<Game />} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </BrowserRouter>
        )
    }
}

const container = document.getElementById('react-app');
const root = ReactDOM.createRoot(container);
root.render(<App />);