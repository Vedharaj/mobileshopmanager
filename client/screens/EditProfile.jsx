import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { global } from "../styles/global";
import { useDispatch, useSelector } from "react-redux";
import { updateProfile } from "../store/slices/authSlice";
import { showToast } from "../store/slices/toastSlice";

const EditProfile = ({ navigation }) => {
  const dispatch = useDispatch();
  const {user, status, error} = useSelector((state) => state.auth);

  const [email, setEmail] = useState(user?.email || "");
  const [username, setUsername] = useState( user?.username || "");


  const handleSaveChanges = async () => {
    try {
      await dispatch(updateProfile({ email, username })).unwrap();
      dispatch(showToast({
        message: "Profile updated successfully!",
        type: "success",
      }));
      navigation.goBack();
    } catch (error) {
      dispatch(showToast({
        message: error || "Failed to update profile",
        type: "error",
      }));
      console.error("Profile update error:", error);
    }
  };

  return (
    <View style={global.mainContainer}>
      <Text style={global.label}>Username</Text>
      <TextInput
        style={global.input}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <Text style={global.label}>Email</Text>
      <TextInput
        style={global.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TouchableOpacity style={global.button} onPress={handleSaveChanges}>
        <Text style={global.btnText}>
          {status === "loading" ? "Updating..." : "Save Changes"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default EditProfile;
