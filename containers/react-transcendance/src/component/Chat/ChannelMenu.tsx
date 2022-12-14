import { useState } from 'react'
import NewChannelButton from './NewChannelButton'
import {Channel} from "../../utils/Message";

function DisplayList(props: {
	joinedChannels: Channel[],
	searchedChannels: string[],
	isSearching: boolean,
	currentChannel: Channel | undefined,
	setCurrentChannel: Function,
	}) {
	const ChannelButtonStyle = (channel: Channel) => {
		return props.currentChannel === undefined
    || channel.channelName !== props.currentChannel.channelName ? {
			backgroundColor:  '#458588',
		} : {
			backgroundColor:  '#83a598',
			border: 'inset .2rem #a89984'
		}
	}


	if (props.isSearching) {
		return (
				<div className="channelList">
				{
					props.searchedChannels.map((name: string, idx: number)=> 
							<button
								key={idx}
								>
                {name}</button>
					)
				}
				</div>
		)
	} else {
		return (
			<div className="channelList">
			{
			props.joinedChannels.map((channel: Channel, idx: number) =>
				<button
					key={idx}
					style={ChannelButtonStyle(channel)}
					onClick={()=>props.setCurrentChannel(channel)}
					>
					{channel.channelName}</button>
			)}
			</div>
		)
	}
}

function ChannelMenu(props: {currentChannel: Channel | undefined,
	setCurrentChannel: Function,
	toggleMenu: Function
	joinedChannel: Channel[]}) {

	const [isSearching, setIsSearching] = useState(false);
	const [searchedChannels, setSearchedChannels] = useState<string[]>([]);
	const [query, setQuery] = useState('');

	const EnableSearch = () => {
    setIsSearching(true);
	}

	const DisableSearch = () => {
    setIsSearching(false);
	}

	const SearchQuery = (event: any) => {
		if (!isSearching)
			return;
    fetch('http://localhost:3000/channel/getMatchingNames/' + event.target.value, {
        credentials: 'include',
        method: 'GET',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
        },
    }).then((result) => {
      result.text().then((text)=> {
				console.log(JSON.parse(text).channels);
        setSearchedChannels(JSON.parse(JSON.parse(text).channels));
      });
    })
	}

	return (
			<div className="channelMenu">
				<header
					style={isSearching ? {display: "block"} : {}}
				>
					<input type="text" onFocus={EnableSearch} onBlur={DisableSearch}
						placeholder="search" onChange={SearchQuery}/>
					<NewChannelButton
            toggle={()=>props.toggleMenu(true)}
            style={isSearching ? {display: "none"} : {}}
          />
				</header>
				<DisplayList
					joinedChannels={props.joinedChannel}
					searchedChannels={searchedChannels}
					isSearching={isSearching}
					currentChannel={props.currentChannel}
					setCurrentChannel={props.setCurrentChannel}
				/>
			</div>
		);
}

export default ChannelMenu;