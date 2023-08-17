var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { Component } from "react";
import { Dimensions, Image, LogBox, Modal, SafeAreaView, ScrollView, Text, TouchableOpacity, View, } from "react-native";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";
import AutoHeightImage from "react-native-auto-height-image";
import ImageCropOverlay from "./ImageCropOverlay";
import { AntDesign, Feather } from "@expo/vector-icons";
import { cross, crop, rotate, flipLeft, flipDown } from "./assets/images";
const { width: screenWidth } = Dimensions.get("window");
LogBox.ignoreLogs([
    "componentWillReceiveProps",
    "componentWillUpdate",
    "componentWillMount",
]);
LogBox.ignoreLogs([
    "Warning: componentWillMount is deprecated",
    "Warning: componentWillReceiveProps is deprecated",
    "Module RCTImageLoader requires",
]);
class ImageManipulatorView extends Component {
    constructor(props) {
        super(props);
        this.initialState = {
            uri: undefined,
            base64: undefined,
            cropMode: false,
            processing: false,
            zoomScale: 1,
            safeAreaHeight: 0,
            imageLayout: { x: 0, y: 0, width: 0, height: 0 },
            enableScroll: true,
            scrollOffsetY: 0,
        };
        this.onGetCorrectSizes = (w, h) => {
            const sizes = {
                convertedWidth: w,
                convertedHeight: h,
            };
            const ratio = Math.min(1920 / w, 1080 / h);
            sizes.convertedWidth = Math.round(w * ratio);
            sizes.convertedHeight = Math.round(h * ratio);
            return sizes;
        };
        this.onToggleModal = () => {
            const { onToggleModal } = this.props;
            onToggleModal();
            if (this.mounted) {
                this.setState({ cropMode: false });
            }
        };
        this.onCropImage = () => {
            const { uri } = this.state;
            if (!uri) {
                return;
            }
            this.setState({ processing: true });
            Image.getSize(uri, (actualWidth, actualHeight) => __awaiter(this, void 0, void 0, function* () {
                const cropObj = this.getCropBounds(actualWidth, actualHeight);
                if (cropObj.height > 0 && cropObj.width > 0) {
                    let uriToCrop = uri;
                    if (this.isRemote) {
                        const response = yield FileSystem.downloadAsync(uri, FileSystem.documentDirectory + "image");
                        uriToCrop = response.uri;
                    }
                    const { uri: uriCroped, base64, width: croppedWidth, height: croppedHeight, } = yield this.crop(cropObj, uriToCrop);
                    this.actualSize.width = croppedWidth;
                    this.actualSize.height = croppedHeight;
                    this.setState({
                        uri: uriCroped,
                        base64,
                        cropMode: false,
                        processing: false,
                    }, () => (this.cropped = true));
                }
                else {
                    this.setState({ cropMode: false, processing: false });
                }
            }));
        };
        this.onRotateImage = () => __awaiter(this, void 0, void 0, function* () {
            const { uri } = this.state;
            if (!uri) {
                return;
            }
            let uriToCrop = uri;
            if (this.isRemote) {
                const response = yield FileSystem.downloadAsync(uri, FileSystem.documentDirectory + "image");
                uriToCrop = response.uri;
            }
            Image.getSize(uri, (width, _height) => __awaiter(this, void 0, void 0, function* () {
                const { uri: rotUri, base64 } = yield this.rotate(uriToCrop);
                this.setState({ uri: rotUri, base64 });
            }));
        });
        this.onFlipImage = (orientation) => __awaiter(this, void 0, void 0, function* () {
            const { uri } = this.state;
            if (!uri) {
                return;
            }
            let uriToCrop = uri;
            if (this.isRemote) {
                const response = yield FileSystem.downloadAsync(uri, FileSystem.documentDirectory + "image");
                uriToCrop = response.uri;
            }
            Image.getSize(uri, () => __awaiter(this, void 0, void 0, function* () {
                const { uri: rotUri, base64 } = yield this.flip(uriToCrop, orientation);
                this.setState({ uri: rotUri, base64 });
            }));
        });
        this.getCropBounds = (actualWidth, actualHeight) => {
            const imageRatio = actualHeight / actualWidth;
            const renderedImageWidth = screenWidth;
            const renderedImageHeight = screenWidth * imageRatio;
            const widthRatio = actualWidth / renderedImageWidth;
            const heightRatio = actualHeight / renderedImageHeight;
            return {
                originX: Math.round(this.currentPos.left * widthRatio),
                originY: Math.round(this.currentPos.top * heightRatio),
                width: Math.round(this.currentSize.width * widthRatio),
                height: Math.round(this.currentSize.height * heightRatio),
            };
        };
        this.flip = (uri, orientation) => __awaiter(this, void 0, void 0, function* () {
            const { saveOptions } = this.props;
            return yield ImageManipulator.manipulateAsync(uri, [
                {
                    flip: orientation,
                },
            ], saveOptions);
        });
        this.rotate = (uri) => __awaiter(this, void 0, void 0, function* () {
            const { saveOptions } = this.props;
            return yield ImageManipulator.manipulateAsync(uri, [{ rotate: -90 }], saveOptions);
        });
        this.crop = (cropObj, uri) => __awaiter(this, void 0, void 0, function* () {
            const { saveOptions } = this.props;
            if (cropObj.height > 0 && cropObj.width > 0) {
                return yield ImageManipulator.manipulateAsync(uri, [
                    {
                        crop: cropObj,
                    },
                ], saveOptions);
            }
            return {
                uri: uri,
                base64: undefined,
                width: 0,
                height: 0,
            };
        });
        this.state = Object.assign({}, this.initialState);
        this.initializeVariables();
        this.mounted = false;
    }
    initializeVariables() {
        this.currentPos = {
            left: 0,
            top: 0,
        };
        this.currentSize = {
            width: 0,
            height: 0,
        };
        this.maxSizes = {
            width: 0,
            height: 0,
        };
        this.actualSize = {
            width: 0,
            height: 0,
        };
        this.cropped = false;
    }
    componentDidMount() {
        return __awaiter(this, void 0, void 0, function* () {
            this.mounted = true;
            yield this.onConvertImageToEditableSize();
        });
    }
    onConvertImageToEditableSize() {
        return __awaiter(this, void 0, void 0, function* () {
            this.initializeVariables();
            this.setState(this.initialState, () => {
                const { photo: { uri: rawUri }, saveOptions, } = this.props;
                if (rawUri === undefined || rawUri === null || rawUri === "") {
                    return;
                }
                Image.getSize(rawUri, (imgW, imgH) => __awaiter(this, void 0, void 0, function* () {
                    const { convertedWidth, convertedHeight } = this.onGetCorrectSizes(imgW, imgH);
                    const { uri, width: w, height, } = yield ImageManipulator.manipulateAsync(rawUri, [
                        {
                            resize: {
                                width: convertedWidth,
                                height: convertedHeight,
                            },
                        },
                    ], saveOptions);
                    if (this.mounted) {
                        this.setState({ uri });
                        this.actualSize.width = w;
                        this.actualSize.height = height;
                    }
                }));
            });
        });
    }
    get isRemote() {
        const { uri } = this.state;
        if (!uri) {
            throw new Error("state.uri is still undefined.");
        }
        return /^(http|https|ftp)?(?:[:/]*)([a-z0-9.-]*)(?::([0-9]+))?(\/[^?#]*)?(?:\?([^#]*))?(?:#(.*))?$/.test(uri);
    }
    // eslint-disable-next-line camelcase
    UNSAFE_componentWillReceiveProps(newProps) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.onConvertImageToEditableSize();
        });
    }
    componentWillUnmount() {
        this.mounted = false;
    }
    render() {
        const { isVisible, onPictureChosen, onBeforePictureChosen, borderColor, allowRotate = true, allowFlip = true, btnTexts, fixedMask, ratio, } = this.props;
        const { uri, base64, cropMode, processing } = this.state;
        const imageRatio = this.actualSize.height / this.actualSize.width;
        const screenHeight = Dimensions.get("window").height - this.state.safeAreaHeight;
        const screenRatio = screenHeight / screenWidth;
        let cropWidth = screenWidth;
        let cropHeight = imageRatio < screenRatio ? screenWidth * imageRatio : screenHeight - 200;
        let cropMinWidth = 60;
        let cropMinHeight = 60;
        if (ratio && ratio.width && ratio.height) {
            const cropRatio = ratio.height / ratio.width;
            if (cropRatio > imageRatio) {
                cropWidth = cropHeight / cropRatio;
            }
            else {
                cropHeight = cropWidth * cropRatio;
            }
            if (cropRatio < 1) {
                cropMinWidth = cropMinHeight / cropRatio;
            }
            else {
                cropMinHeight = cropMinWidth * cropRatio;
            }
        }
        const cropInitialTop = (Math.min(this.state.imageLayout.height, screenHeight) - cropHeight) /
            2.0 +
            this.state.scrollOffsetY;
        const cropInitialLeft = (screenWidth - cropWidth) / 2.0;
        if (this.currentSize.width === 0 && cropMode) {
            this.currentSize.width = cropWidth;
            this.currentSize.height = cropHeight;
            this.currentPos.top = cropInitialTop;
            this.currentPos.left = cropInitialLeft;
        }
        return (React.createElement(Modal, { animationType: "slide", transparent: true, visible: isVisible, hardwareAccelerated: true, onRequestClose: () => {
                this.onToggleModal();
            } },
            React.createElement(SafeAreaView, { style: {
                    width: screenWidth,
                    flexDirection: "row",
                    backgroundColor: "black",
                    justifyContent: "space-between",
                }, onLayout: (e) => this.setState({ safeAreaHeight: e.nativeEvent.layout.height }) },
                React.createElement(ScrollView, { scrollEnabled: false, horizontal: true, contentContainerStyle: {
                        width: "100%",
                        paddingHorizontal: 15,
                        height: 44,
                        alignItems: "center",
                    } }, !cropMode ? (React.createElement(View, { style: { flexDirection: "row", alignItems: "center" } },
                    React.createElement(TouchableOpacity, { onPress: () => this.onToggleModal(), style: {
                            width: 32,
                            height: 32,
                            alignItems: "center",
                            justifyContent: "center",
                        } }, this.props.icons.back),
                    React.createElement(View, { style: {
                            flex: 1,
                            flexDirection: "row",
                            justifyContent: "flex-end",
                        } },
                        React.createElement(TouchableOpacity, { onPress: () => this.setState({ cropMode: true }), style: {
                                marginLeft: 10,
                                width: 32,
                                height: 32,
                                alignItems: "center",
                                justifyContent: "center",
                            } }, this.props.icons.crop),
                        allowRotate && (React.createElement(View, { style: { flexDirection: "row" } },
                            React.createElement(TouchableOpacity, { onPress: () => this.onRotateImage(), style: {
                                    marginLeft: 10,
                                    width: 32,
                                    height: 32,
                                    alignItems: "center",
                                    justifyContent: "center",
                                } }, this.props.icons.rotate),
                            React.createElement(TouchableOpacity, { onPress: () => this.onFlipImage(ImageManipulator.FlipType.Vertical), style: {
                                    marginLeft: 10,
                                    width: 32,
                                    height: 32,
                                    alignItems: "center",
                                    justifyContent: "center",
                                } }, this.props.icons.flipDown))),
                        allowFlip && (React.createElement(View, { style: { flexDirection: "row" } },
                            React.createElement(TouchableOpacity, { onPress: () => this.onFlipImage(ImageManipulator.FlipType.Horizontal), style: {
                                    marginLeft: 10,
                                    width: 32,
                                    height: 32,
                                    alignItems: "center",
                                    justifyContent: "center",
                                } }, this.props.icons.flipLeft),
                            React.createElement(TouchableOpacity, { onPress: () => {
                                    if (uri) {
                                        Image.getSize(uri, (width, height) => {
                                            let success = true;
                                            const data = {
                                                uri,
                                                base64,
                                                width,
                                                height,
                                                cropped: this.cropped,
                                            };
                                            if (onBeforePictureChosen) {
                                                success = onBeforePictureChosen(data);
                                            }
                                            if (success) {
                                                onPictureChosen(data);
                                                this.onToggleModal();
                                            }
                                        });
                                    }
                                }, style: {
                                    marginLeft: 10,
                                    width: 60,
                                    height: 32,
                                    alignItems: "center",
                                    justifyContent: "center",
                                } },
                                React.createElement(Text, { style: [
                                        {
                                            color: "white",
                                        },
                                        this.props.btnTextsStyle,
                                    ] }, btnTexts.done))))))) : (React.createElement(View, { style: {
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                    } },
                    React.createElement(TouchableOpacity, { onPress: () => this.setState({ cropMode: false }), style: {
                            width: 32,
                            height: 32,
                            alignItems: "center",
                            justifyContent: "center",
                        } }, this.props.icons.back),
                    React.createElement(TouchableOpacity, { onPress: () => this.onCropImage(), style: {
                            marginRight: 10,
                            alignItems: "flex-end",
                            flex: 1,
                        } },
                        React.createElement(View, { style: { flexDirection: "row", alignItems: "center" } },
                            processing
                                ? this.props.icons.processing
                                : this.props.icons.confirm,
                            React.createElement(Text, { style: [
                                    {
                                        color: "white",
                                    },
                                    this.props.btnTextsStyle,
                                ] }, !processing ? btnTexts.crop : btnTexts.processing))))))),
            React.createElement(View, { style: {
                    flex: 1,
                    backgroundColor: "black",
                    width: Dimensions.get("window").width,
                } },
                React.createElement(ScrollView, { style: { position: "relative", flex: 1 }, contentContainerStyle: {
                        backgroundColor: "black",
                        justifyContent: "center",
                    }, bounces: false, scrollEnabled: this.state.enableScroll, onScrollEndDrag: (e) => this.setState({ scrollOffsetY: e.nativeEvent.contentOffset.y }) },
                    uri && (React.createElement(AutoHeightImage, { source: { uri }, resizeMode: "contain", width: screenWidth, onLayout: (e) => this.setState({ imageLayout: e.nativeEvent.layout }) })),
                    cropMode && (React.createElement(ImageCropOverlay, { onStartLayoutChange: () => this.setState({ enableScroll: false }), onLayoutChanged: (top, left, width, height) => {
                            this.currentSize.width = width;
                            this.currentSize.height = height;
                            this.currentPos.top = top;
                            this.currentPos.left = left;
                            this.setState({ enableScroll: true });
                        }, initialWidth: (fixedMask && fixedMask.width) || cropWidth, initialHeight: (fixedMask && fixedMask.height) || cropHeight, initialTop: cropInitialTop, initialLeft: cropInitialLeft, minWidth: (fixedMask && fixedMask.width) || cropMinWidth, minHeight: (fixedMask && fixedMask.height) || cropMinHeight, borderColor: borderColor, ratio: ratio || undefined, safeAreaHeight: this.state.safeAreaHeight, imageLayout: this.state.imageLayout, scrollOffsetY: this.state.scrollOffsetY }))))));
    }
}
ImageManipulatorView.defaultProps = {
    borderColor: "#a4a4a4",
    btnTexts: {
        crop: "Crop",
        rotate: "Rotate",
        done: "Done",
        processing: "Processing",
    },
    icons: {
        back: React.createElement(Image, { source: cross, style: { width: 32, height: 32 } }),
        crop: React.createElement(Image, { source: crop, style: { width: 32, height: 32 } }),
        rotate: React.createElement(Image, { source: rotate, style: { width: 32, height: 32 } }),
        flipLeft: React.createElement(Image, { source: flipLeft, style: { width: 32, height: 32 } }),
        flipDown: React.createElement(Image, { source: flipDown, style: { width: 32, height: 32 } }),
        processing: (React.createElement(Feather, { style: { marginRight: 6 }, name: "loader", size: 32, color: "white" })),
        confirm: (React.createElement(AntDesign, { style: { marginRight: 6 }, name: "check", size: 24, color: "white" })),
    },
    saveOptions: {
        compress: 1,
        format: ImageManipulator.SaveFormat.PNG,
        base64: false,
    },
    fixedMask: undefined,
};
export default ImageManipulatorView;
