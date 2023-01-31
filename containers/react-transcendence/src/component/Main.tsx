import { useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useCookies } from 'react-cookie';
import { Socket } from 'socket.io-client';

import 'static/Main.scss'

import {
	FaHome,
	FaTableTennis,
	FaCommentDots,
	FaUser,
	FaDoorOpen
	} from 'react-icons/fa'

import Home from './Home/Home'
import Play from './Play/Play'
import Chat from './Chat/Chat'
import Profile from './Profile/Profile'


function Main(props: {component: any, socket: Socket}) {
	const navigate = useNavigate();
	const location = useLocation();
	const tab = location.pathname.split('/')[1];
  const [cookie,, removeCookie] = useCookies(['auth', 'userInfo']);

	const ProcessLogout = () => {
    removeCookie('auth', {path: '/'});
    removeCookie('userInfo', {path: '/'});
		navigate('/');
    props.socket.close();
	}

  useEffect(() => {
    if (cookie['auth'] === undefined || cookie['userInfo'] === undefined)
      navigate('/');
  }, []);


	const pages = [
		{ icon: <FaHome/>, ref: 'home', component: <Home />},
		{ icon: <FaTableTennis/>, ref: 'game', component: <Play/>},
		{ icon: <FaCommentDots/>, ref: 'chat', component: <Chat socket={props.socket}/>},
		{ icon: <FaUser/>, ref: 'profile', component: <Profile user={cookie['userInfo']}/>},
	];

	const tabStyle= (ref: string): React.CSSProperties  => {
		return ref === tab ? {
			background: "#3c3836",
			color: "#ebdbb2"
		}: {}
	}

	return (
			<main>
				<div className="links">
				{
					pages.map((page, idx) => 
						<Link to={'/' + page.ref} key={idx}
						style={tabStyle(page.ref)}>
							{page.icon}
						</Link>
					)
				}
				<button onClick={ProcessLogout}><FaDoorOpen /></button></div>
          <div className="slides">{props.component}</div>
			</main>
   )
}

export default Main;

