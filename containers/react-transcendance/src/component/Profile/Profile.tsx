import React from 'react'
import { useState } from 'react'

import 'static/Profile.scss'
import {ReactComponent as SchoolLogo} from 'static/logo.svg'

import PlaceholderPic from 'static/yikes.jpg'

import Historic from './Historic'


function Profile() {
  const [ getState, setState ] =  useState({
	user: {
		name: "Jean Marie",
		picture: "https://cdn.intra.42.fr/users/f27b945e9b897115a72dec00527d7bcd/fschlute.JPG",
		wins: 2,
		losses: 4,
		gamesPlayed: 6,
		Oauth: true,
	}
});

function fetchUserData() {
  fetch("localhost:3000",
      {method: 'GET'})
  .then(request => {
      return request.text();
      })
  .then((text)=> {
      setState({name: text});
      })
  .catch(error => {
      return "test";
      })
};

return (
  <div className="Profile">
    <div className="userCard">
      <div className="profileHeader">
	<img src={getState.user.picture} alt="JD" />
	<a href="" className="Oauth"
	style={{background: getState.user.Oauth ? "#b8bb26" : "#cc241d"}}>
	  <SchoolLogo/> {getState.user.Oauth ? "√" : "×" }
	</a>
      </div>
      <h4>{getState.user.name}</h4>
      <div className="stats">
	<p className="games">
	  games played: {getState.user.gamesPlayed}
	</p>
	<p className="win">
	  won: {getState.user.wins}
	</p>
	<p className="loss">
	  lost: {getState.user.losses}
	</p>
      </div>
    </div>
    <Historic></Historic>
  </div>
);
}

export default Profile;
