import React, { useEffect, useMemo } from "react";
import { Appearance, AppState, View, StatusBar } from "react-native";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import {
  useScreenAnalytics,
  actions,
  BaniLengthSelector,
  constant,
  colors,
  useKeepAwake,
  BaniList,
} from "@common";
import styles from "./styles";
import BaniHeader from "./components/BaniHeader";
import { useAnalytics, useAppFirstTime, useBaniLength, useBaniList } from "./hooks";

const HomeScreen = React.memo(({ navigation }) => {
  const { navigate } = navigation;
  const { baniListData } = useBaniList();
  const isNightMode = useSelector((state) => state.isNightMode);
  const isStatusBar = useSelector((state) => state.isStatusBar);
  const language = useSelector((state) => state.language);
  const theme = useSelector((state) => state.theme);
  useKeepAwake();
  useAnalytics();
  useScreenAnalytics(constant.HOME_SCREEN);
  const isAppOpenFirstTime = useAppFirstTime();
  const { baniLengthSelector } = useBaniLength();
  const dispatch = useDispatch();

  const colorScheme = useMemo(() => Appearance.getColorScheme(), []);
  const updateTheme = () => {
    if (theme === constant.Default) {
      dispatch(actions.toggleNightMode(colorScheme === "dark"));
    }
  };
  useEffect(() => {
    dispatch(actions.setLanguage(language));
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        updateTheme();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [theme, colorScheme]);

  const onPress = (row) => {
    const bani = row.item;
    if (!bani.folder) {
      navigate(constant.READER, {
        key: `Reader-${bani.id}`,
        params: { id: bani.id, title: bani.gurmukhi },
      });
    } else {
      navigate(constant.FOLDERSCREEN, {
        key: `Folder-${bani.gurmukhi}`,
        params: { data: bani.folder, title: bani.gurmukhi },
      });
    }
  };

  return (
    <View style={[isNightMode && { backgroundColor: colors.NIGHT_BLACK }, styles.container]}>
      <StatusBar
        hidden={isStatusBar}
        barStyle="light-content"
        backgroundColor={colors.TOOLBAR_COLOR}
      />
      <BaniHeader navigate={navigate} />
      {(isAppOpenFirstTime || baniLengthSelector) && <BaniLengthSelector />}
      <BaniList data={baniListData} onPress={onPress.bind(this)} />
    </View>
  );
});

HomeScreen.propTypes = {
  navigation: PropTypes.shape({ navigate: PropTypes.func.isRequired }).isRequired,
};

export default HomeScreen;
