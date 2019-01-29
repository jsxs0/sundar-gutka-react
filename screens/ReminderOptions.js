import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  Platform,
  FlatList,
  Picker,
  TouchableOpacity,
  Alert
} from "react-native";
import { Header } from "react-native-elements";
import Icon from "react-native-vector-icons/MaterialIcons";
import GLOBAL from "../utils/globals";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import * as actions from "../actions/actions";
import AnalyticsManager from "../utils/analytics";
import Collapsible from "react-native-collapsible";
import NotificationsManager from "../utils/notifications";
import Accordion from "react-native-collapsible/Accordion";
import DateTimePicker from "react-native-modal-datetime-picker";
import moment from "moment";
import ModalSelector from "react-native-modal-selector";
import Database from "../utils/database";
import ReminderPanel from "../components/ReminderPanel";

class ReminderOptions extends React.Component {
  componentDidMount() {
    AnalyticsManager.getInstance().trackScreenView("Reminder Options");
  }

  componentWillMount() {
    Database.getBaniList().then(baniList => {
      this.setState(
        {
          baniList: baniList
        },
        function() {
          if (JSON.parse(this.props.reminderBanis).length == 0) {
            this.setDefaultReminders();
          }
        }
      );
    });
  }

  setDefaultReminders() {
    //alert(this.props.reminderBanis);
    var defaultBanis = [];

    // Add Gur Mantar
    defaultBanis.push({
      key: 1,
      gurmukhi: this.state.baniList[1].gurmukhi,
      roman: this.state.baniList[1].roman,
      time: "3:00 AM"
    });

    // Add Japji Sahib
    defaultBanis.push({
      key: 2,
      gurmukhi: this.state.baniList[2].gurmukhi,
      roman: this.state.baniList[2].roman,
      time: "3:30 AM"
    });

    // Add Rehras Sahib
    defaultBanis.push({
      key: 21,
      gurmukhi: this.state.baniList[21].gurmukhi,
      roman: this.state.baniList[21].roman,
      time: "6:00 PM"
    });

    // Add Sohila
    defaultBanis.push({
      key: 23,
      gurmukhi: this.state.baniList[23].gurmukhi,
      roman: this.state.baniList[23].roman,
      time: "10:00 PM"
    });

    this.props.setReminderBanis(JSON.stringify(defaultBanis));
    NotificationsManager.getInstance().updateReminders(
      this.props.reminders,
      JSON.stringify(defaultBanis)
    );
  }

  _resetReminderDefaults() {
    Alert.alert(
      "Reset Reminders",
      "Do you want to restore reminders to the default values?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => this.setDefaultReminders()
        }
      ]
    );
  }

  _addBaniReminder() {
    var baniOptions = [];
    let isRomanized = this.props.romanized;
    let curBaniList = this.state.baniList;

    let existingKeys = JSON.parse(this.props.reminderBanis).map(function(bani) {
      return bani.key;
    });

    Object.keys(curBaniList).forEach(function(key) {
      if (!existingKeys.includes(key) && key < 10000) {
        baniOptions.push({
          key: key,
          label: isRomanized
            ? curBaniList[key].roman
            : curBaniList[key].gurmukhi,
          gurmukhi: curBaniList[key].gurmukhi,
          roman: curBaniList[key].roman
        });
      }
    });
    this.setState(
      {
        reminderBaniData: baniOptions
      },
      function() {
        this.selector.open();
      }
    );
  }

  _addReminder(baniObject) {
    var array = JSON.parse(this.props.reminderBanis);

    array.push({
      key: baniObject.key,
      gurmukhi: baniObject.gurmukhi,
      roman: baniObject.roman,
      time: moment(new Date())
        .local()
        .format("h:mm A")
    });

    this.props.setReminderBanis(JSON.stringify(array));
    NotificationsManager.getInstance().updateReminders(
      this.props.reminders,
      JSON.stringify(array)
    );
  }

  state = {
    activeSections: [],
    reminderBaniData: [],
    baniList: null,
    isTimePickerVisible: false,
    timePickerSectionKey: -1
  };

  _showTimePicker = () => this.setState({ isTimePickerVisible: true });

  _hideTimePicker = () => this.setState({ isTimePickerVisible: false });

  _handleTimePicked = time => {
    this._hideTimePicker();
    var array = JSON.parse(this.props.reminderBanis);
    array
      .filter(obj => {
        return obj.key == this.state.timePickerSectionKey;
      })
      .map(foundObj => {
        foundObj.time = moment(time)
          .local()
          .format("h:mm A");
      });
    this.props.setReminderBanis(JSON.stringify(array));
    NotificationsManager.getInstance().updateReminders(
      this.props.reminders,
      JSON.stringify(array)
    );
  };

  render() {
    return (
      <View
        style={{
          flex: 1
        }}
      >
        <Header
          outerContainerStyles={{ borderBottomWidth: 0 }}
          backgroundColor={GLOBAL.COLOR.TOOLBAR_COLOR_ALT2}
          leftComponent={
            <Icon
              name="arrow-back"
              color={GLOBAL.COLOR.TOOLBAR_TINT}
              size={30}
              onPress={() => this.props.navigation.goBack()}
            />
          }
          centerComponent={{
            text: "Reminder Options",
            style: { color: GLOBAL.COLOR.TOOLBAR_TINT, fontSize: 18 }
          }}
          rightComponent={
            <View style={{ flexDirection: "row" }}>
              <Icon
                name="refresh"
                color={GLOBAL.COLOR.TOOLBAR_TINT}
                size={30}
                onPress={() => this._resetReminderDefaults()}
              />
              <Icon
                style={{ paddingLeft: 15 }}
                name="add"
                color={GLOBAL.COLOR.TOOLBAR_TINT}
                size={30}
                onPress={() => this._addBaniReminder()}
              />
            </View>
          }
        />
        <ModalSelector
          data={this.state.reminderBaniData}
          ref={selector => {
            this.selector = selector;
          }}
          optionTextStyle={[
            styles.optionText,
            !this.props.romanized && { fontFamily: "GurbaniAkharHeavySG" }
          ]}
          customSelector={<View />}
          cancelText={"Cancel"}
          onChange={option => {
            this._addReminder(option);
          }}
        />
        <View
          style={[
            styles.container,
            this.props.nightMode && { backgroundColor: "#464646" }
          ]}
        >
          <Accordion
            activeSections={this.state.activeSections}
            sections={JSON.parse(this.props.reminderBanis)}
            renderHeader={this._renderHeader}
            renderContent={this._renderContent}
            onChange={this._updateSections}
          />

          <DateTimePicker
            isVisible={this.state.isTimePickerVisible}
            onConfirm={time => this._handleTimePicked(time)}
            onCancel={this._hideTimePicker}
            titleIOS={"Pick a Time:"}
            mode={"time"}
          />
        </View>
      </View>
    );
  }

  _renderHeader = section => {
    return (
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            this.setState({ timePickerSectionKey: section.key });
            this._showTimePicker();
          }}
        >
          <Text style={styles.timeStyle}>{section.time}</Text>
        </TouchableOpacity>

        <Text
          style={[
            styles.headerText,
            !this.props.romanized && { fontFamily: "GurbaniAkharHeavySG" }
          ]}
        >
          {this.props.romanized ? section.roman : section.gurmukhi}
        </Text>
      </View>
    );
  };

  _renderContent = section => {
    return (
      <View style={styles.content}>
        <Text>More options will go here</Text>
      </View>
    );
  };

  _updateSections = activeSections => {
    this.setState({ activeSections });
  };

  // _renderRow = ({ data, active }) => {
  //   return (
  //     <ReminderPanel
  //       title="B Panel with short content text"
  //       data={data}
  //       active={active}
  //       nightMode={this.props.nightMode}
  //       romanized={this.props.romanized}
  //       fontFace={this.props.fontFace}
  //       fontSize={this.props.fontSize}
  //     />
  //   );
  // };
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  timeStyle: {
    color: GLOBAL.COLOR.SETTING_SWITCH_COLOR,
    fontSize: 34
  },
  headerText: {
    color: "#404"
  },
  optionText: {},
  separator: {
    height: 2
  },
  list: {
    flex: 1
  }
});

function mapStateToProps(state) {
  return {
    nightMode: state.nightMode,
    baniOrder: state.baniOrder,
    reminders: state.reminders,
    reminderBanis: state.reminderBanis,
    romanized: state.romanized,
    fontSize: state.fontSize,
    fontFace: state.fontFace
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(actions, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ReminderOptions);
