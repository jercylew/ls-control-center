//home.js View for displaying device status
import React, {Component} from 'react';
import {
  StyleSheet,
  Text,
  SafeAreaView,
  SectionList,
  StatusBar,
  TouchableOpacity,
} from 'react-native';

const DATA = [
  {
    title: '广电开源名都酒店',
    data: [
      {
        name: '保温售菜台1',
        id: 'LS_100001',
        is_heating: 0,
        is_up_water: 0,
        net_type: 1,
        detection_temperature: 0,
        water_level_detection: 1000,
      },
      {
        name: '保温售菜台2',
        id: 'LS_100002',
        is_heating: 0,
        is_up_water: 0,
        net_type: 1,
        detection_temperature: 0,
        water_level_detection: 1000,
      },
    ],
  },
  {
    title: '金迪酒店',
    data: [
      {
        name: '保温售菜台1',
        id: 'LS_100003',
        is_heating: 0,
        is_up_water: 0,
        net_type: 1,
        detection_temperature: 0,
        water_level_detection: 1000,
      },
      {
        name: '保温售菜台',
        id: 'LS_100004',
        is_heating: 0,
        is_up_water: 0,
        net_type: 1,
        detection_temperature: 0,
        water_level_detection: 1000,
      },
    ],
  },
];

const Item = ({devPros}) => (
  <TouchableOpacity
    style={styles.item}
    onPress={() => {
      console.log('Item Clicked', devPros);
    }}>
    <Text style={styles.title}>{devPros.name}</Text>
  </TouchableOpacity>
);

class Devices extends Component {
  constructor(props) {
    super(props);
    this.state = {devices: []};
  }

  updateDevice(device) {
    //this.state = this.initialState;
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <SectionList
          sections={DATA}
          keyExtractor={(item, index) => item.id + index}
          renderItem={({item}) => <Item devPros={item} />}
          renderSectionHeader={({section: {title}}) => (
            <Text style={styles.header}>{title}</Text>
          )}
        />
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight,
    marginHorizontal: 16,
  },
  item: {
    backgroundColor: '#f9c2ff',
    padding: 20,
    marginVertical: 8,
  },
  header: {
    fontSize: 32,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
  },
});

export default Devices;
