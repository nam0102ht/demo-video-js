import React from 'react';
import VideoApp from "./components/VideoApp";
import VideoAd from "./components/VideoAd"
import { Switch, Route, BrowserRouter } from 'react-router-dom';

function App() {
  return (
	<BrowserRouter>
		<Switch>
			<Route path="/" exact component={VideoApp} />
			<Route path="/ima" component={VideoAd} />
		</Switch>
	</BrowserRouter>
  );
}

export default App;
