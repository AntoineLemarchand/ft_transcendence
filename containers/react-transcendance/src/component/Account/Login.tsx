import * as React from 'react'
import { useState, useEffect } from 'react'
import {useNavigate} from 'react-router-dom';
import { useCookies } from 'react-cookie';

import 'static/Account/Prompt.scss'
import { URLEncodedUTF8 } from "../../utils/Url";

import {ReactComponent as SchoolLogo} from 'static/logo.svg'

function Login() {
    const navigate = useNavigate();
    const [cookie, setCookie] = useCookies(['auth', 'userInfo']);
    const [state, setState] = useState({
        username: '',
        password: '',
    });

	// replace with env var
	const oauth_params = {
		'client_id': 'u-s4t2ud-e02be92b029c1c51dd3a1df387a8a8a8deccd570cbeab4258b75ecd553e2295a',
		'redirect_uri': 'http%3A%2F%2Flocalhost%3A3001%2Fhome',
		'state': (Math.random() + 3).toString(36),
		'response_type': 'code'
		};

	const oauth_uri = URLEncodedUTF8('https://api.intra.42.fr/oauth/authorize?', oauth_params);

    useEffect(() => {
			if (cookie['auth'] !== undefined)
				navigate('/home')
    })

    const ProcessLogin = () => {
			fetch('http://localhost:3000/auth/login', {
				method: 'POST',
				headers: {
						'Content-type': 'application/json; charset=UTF-8',
				},
				body: JSON.stringify({
						'username': state.username,
						'password': state.password,
				}),
			}).then(async response => {
					if (response.status === 201) {
							const token = await response.text().then((body) => {
									return JSON.parse(body).access_token
							})
							setCookie('auth', token)
							navigate('/home');
					} else {
							alert('Wrong credentials');
					}
			})
		}

    const ProcessSignIn = () => {
        navigate('/signin');
    }

    const ProcessOauth = () => {
    }

    const UpdatePassword = (event: React.ChangeEvent<HTMLInputElement>) => {
        setState({
            username: state.username,
            password: event.target.value,
        });
    }

    const UpdateLogin = (event: React.ChangeEvent<HTMLInputElement>) => {
        setState({
            username: event.target.value,
            password: state.password,
        });
    }

    return (
        <div className="Prompt">
            <input type="text" onChange={UpdateLogin} placeholder="Login"/>
            <input type="password" onChange={UpdatePassword} placeholder="Password"/>
            <div className="buttonBox">
                <button className="login"
                        onClick={ProcessLogin}>Login
                </button>
                <button className="signin"
                        onClick={ProcessSignIn}>Sign in
                </button>
				<a href={oauth_uri}>
                <button className="Oauth"
                        onClick={ProcessOauth}><SchoolLogo/></button>
				</a>
            </div>
        </div>
    )
}

export default Login;
