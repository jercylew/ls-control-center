//home.js View for displaying device status
import React, {Component} from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  SectionList,
  StatusBar,
} from 'react-native';

const DATA = [
  {
    title: '广电开源名都酒店',
    data: ['保温售菜台1', '保温售菜台2', '保温售菜台3'],
  },
  {
    title: '银隆海底捞',
    data: ['保温售菜台1', '网卡控制器'],
  },
  {
    title: '万象外婆家',
    data: ['保温售菜台1', '保温售菜台2', '保温售菜台3'],
  },
  {
    title: '金迪酒店',
    data: ['保温售菜台1', '冰箱温湿度控制器'],
  },
];

const Item = ({title}) => (
  <View style={styles.item}>
    <Text style={styles.title}>{title}</Text>
  </View>
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
          keyExtractor={(item, index) => item + index}
          renderItem={({item}) => <Item title={item} />}
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
