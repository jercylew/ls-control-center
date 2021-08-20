/* eslint-disable react-native/no-inline-styles */
//home.js View for displaying device status
import React, {Component} from 'react';
import {Text, View} from 'react-native';

class Home extends Component {
  constructor(props) {
    super(props);

    this.initialState = {
      name: '',
      job: '',
    };

    this.state = this.initialState;
  }

  handleChange = event => {
    const {name, value} = event.target; //object as: {name:name, value:value}

    this.setState({
      //Partial update with ES6 computed property
      [name]: value,
    });
  };

  onFormSubmit = event => {
    event.preventDefault();

    this.props.handleSubmit(this.state);
    this.setState(this.initialState);
  };

  render() {
    const {name, job} = this.state;

    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text>Home!</Text>
      </View>
    );
  }
}

export default Home;
