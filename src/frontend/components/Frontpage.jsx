import React from 'react'
import { useNavigate } from 'react-router-dom';

function Frontpage() {
    const [channel, setChannel] = React.useState("");
    let navigate = useNavigate();

    const goToGame = (e) => {
        e.preventDefault()
        if (channel.length > 0) {
            navigate(channel)
            //this.props.history.push(this.state.channel)
        }
    }

    const handleUserInputChange = (event) => {
        setChannel(event.target.value)
    }

    // TODO: Add Enter click to submit
    return (
        <div className='content'>
            <div className="frontpage">
                <div className="frontpage-intro">
                    Hello! Add your Twitch channel name below to get started.
                </div>
                <br />
                <form onSubmit={goToGame} className="frontpage-create-poll">
                    <div className="shadow inputbox">
                        <input type="text" value={channel} onChange={handleUserInputChange} placeholder="Twitch channel name" />
                        <button type="submit">Go</button>
                    </div>
                </form>
                <div className="frontpage-credits">
                    Author: <a href="https://github.com/Aryuko/">Hanna/Aryu</a>
                    <br />
                    Code: <a href="TODO: add link">GitHub</a>
                </div>
            </div>
        </div>
    )
}

export default Frontpage