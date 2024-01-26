import React, { useEffect, useState, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { View, StatusBar } from "react-native";
import { Icon } from "@rneui/themed";
import Accordion from "react-native-collapsible/Accordion";
import PropTypes from "prop-types";
import ModalSelector from "react-native-modal-selector";
import moment from "moment";
import { colors, constant, STRINGS, errorHandler } from "../../../../common";
import { defaultReminders } from "./utils/helpers";
import { setReminderBanis } from "../../../../common/actions";
import { getBaniList } from "../../../../database/db";
import { styles, accordianNightColor } from "./styles";
import { AccordianContent, AccordianHeader } from "./components";
import { updateReminders } from "../../../../common/notifications";
import { trackReminderEvent } from "../../../../common/analytics";
import FallBack from "../../../../common/components";

function ReminderOptions({ navigation }) {
  const transliterationLanguage = useSelector((state) => state.transliterationLanguage);
  const reminderBanis = useSelector((state) => state.reminderBanis);
  const isNightMode = useSelector((state) => state.isNightMode);
  const isTransliteration = useSelector((state) => state.isTransliteration);
  const isReminders = useSelector((state) => state.isReminders);
  const reminderSound = useSelector((state) => state.reminderSound);

  const [stateData, setStateData] = useState([]);
  const [activeSections, setActiveSections] = useState([]);
  const [reminderBaniData, setReminderBaniData] = useState([]);
  const dispatch = useDispatch();
  const selector = useRef(null);
  const parsedReminderBanis = useMemo(() => JSON.parse(reminderBanis), [reminderBanis]);
  const accNightColor = useMemo(() => accordianNightColor(isNightMode), [isNightMode]);

  const updateSections = (sections) => {
    setActiveSections(sections);
  };
  const setDefaultReminders = async (baniList) => {
    const data = defaultReminders(baniList);
    dispatch(setReminderBanis(JSON.stringify(data)));
    setStateData(data);
    await updateReminders(isReminders, reminderSound, JSON.stringify(data));
    trackReminderEvent(constant.RESET_REMINDER, true);
    return data;
  };

  const headerLeft = () => (
    <Icon
      name="arrow-back"
      size={30}
      onPress={() => navigation.goBack()}
      color={colors.WHITE_COLOR}
    />
  );
  const headerRight = (data) => {
    return (
      <>
        <Icon
          name="refresh"
          color={colors.TOOLBAR_TINT}
          style={{ marginRight: 10 }}
          size={30}
          onPress={() => {
            setDefaultReminders(data);
          }}
        />
        <Icon
          name="add"
          color={colors.TOOLBAR_TINT}
          size={30}
          onPress={() => {
            selector.current.open();
          }}
        />
      </>
    );
  };
  const fetchBani = async () => {
    try {
      const data = await getBaniList(transliterationLanguage);
      const existingKeysSet = new Set(parsedReminderBanis.map((bani) => bani.key));
      const baniOptions = Object.entries(data)
        .filter(([key]) => !existingKeysSet.has(Number(key)) && key < 100000)
        .map(([key, bani]) => ({
          key,
          label: isTransliteration ? bani.translit : bani.gurmukhi,
          gurmukhi: bani.gurmukhi,
          translit: bani.translit,
        }));
      setReminderBaniData(baniOptions);
      if (parsedReminderBanis.length === 0) {
        setStateData(setDefaultReminders(data));
      } else {
        setStateData(parsedReminderBanis);
      }
      navigation.setOptions({
        title: constant.REMINDER_OPTIONS,
        headerTitleStyle: {
          color: colors.WHITE_COLOR,
          fontWeight: "normal",
          fontSize: 18,
        },
        headerStyle: {
          backgroundColor: colors.TOOLBAR_COLOR_ALT2,
        },
        headerLeft,
        headerRight: () => headerRight(data),
      });
    } catch (error) {
      errorHandler(error);
      FallBack();
    }
  };

  useEffect(() => {
    (async () => {
      fetchBani();
    })();
  }, [transliterationLanguage, reminderBanis]);

  const createReminder = async (selectedOption) => {
    const array = parsedReminderBanis;
    const newObjKey = Number(selectedOption.key);
    const existingObjIndex = array.findIndex((item) => item.key === newObjKey);

    if (existingObjIndex === -1) {
      const newObj = {
        key: newObjKey,
        gurmukhi: selectedOption.gurmukhi,
        translit: selectedOption.translit,
        enabled: true,
        title: `${STRINGS.time_for} ${selectedOption.translit}`,
        time: moment(new Date()).local().format("h:mm A"),
      };

      array.push(newObj);
    }

    dispatch(setReminderBanis(JSON.stringify(array)));
    trackReminderEvent(constant.ADD_REMINDER, array);
    await updateReminders(isReminders, reminderSound, JSON.stringify(array));
  };

  return (
    <View
      style={[
        isNightMode && { backgroundColor: colors.INACTIVE_VIEW_COLOR_NIGHT_MODE },
        styles.flexView,
      ]}
    >
      <StatusBar backgroundColor={colors.TOOLBAR_COLOR_ALT2} barStyle="light-content" />
      {stateData.length > 0 && (
        <Accordion
          activeSections={activeSections}
          sections={stateData}
          underlayColor={accNightColor}
          renderHeader={(section, index, isActive) => (
            <AccordianHeader section={section} isActive={isActive} />
          )}
          renderContent={(section, index, isActive) => (
            <AccordianContent section={section} isActive={isActive} />
          )}
          onChange={updateSections}
        />
      )}
      <ModalSelector
        data={reminderBaniData}
        cancelText={STRINGS.cancel}
        optionTextStyle={styles.modalSelecText}
        onChange={(option) => {
          createReminder(option);
        }}
        customSelector={<View />}
        ref={selector}
      />
    </View>
  );
}

ReminderOptions.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    setOptions: PropTypes.func.isRequired,
  }).isRequired,
};
export default ReminderOptions;
