import 'static/Profile/Friends.scss'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'

function Friends(props: {isSelected: boolean, friends: string[]}) {
  const statusColor = (status: string) => {
    if (status === 'in game')
      return {background: '#b16286',}
    else if (status === 'online')
      return {background: '#b8bb26',}
    else
      return {background: '#cc241d',}
  }

  useEffect(()=> {
    console.log(props.friends)
  }, [])

	return (
    <div
      className="Friends"
      style={{display: props.isSelected ? "block" : "none"}}>
      <h1>Friends</h1>
      <div className="friendList">
      {
        props.friends.map((friend: any, idx: number) => {
          return (
            <Link to={'/profile/' + friend} className="friend" key={idx}>
              <img alt="friend avatar"/>
              <p>{friend}</p>
              <div className="status">
                <p>{}</p>
                <span style={statusColor('online')}/>
              </div>
            </Link>
          )
        })
      }
      </div>
    </div>
  )
}

export default Friends;
