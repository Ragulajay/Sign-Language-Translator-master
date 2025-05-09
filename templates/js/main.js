var identity = 0;
var classes = []; // list of classes
// classes = [ {id:1 , name : "Hello" , count : 0}]
var text = ""
var uploadedModel = false;

console.log("Training Page: For training your custom sign langauge model");


const start = async () => {
    const trainingCards = document.getElementById("training-cards")
    const predictions = document.getElementById("predictions")
    const confidence = document.getElementById("confidence")

    const createKNNClassifier = async () => {
        console.log('Loading KNN Classifier');
        return await knnClassifier.create();
    };
    const createMobileNetModel = async () => {
        console.log('Loading Mobilenet Model');
        return await mobilenet.load();
    };
    const createWebcamInput = async () => {
        console.log('Loading Webcam Input');
        const webcamElement = await document.getElementById('webcam');
        return await tf.data.webcam(webcamElement);
    };

    const mobilenetModel = await createMobileNetModel();
    const knnClassifierModel = await createKNNClassifier();
    const webcamInput = await createWebcamInput();
    var preloader = document.getElementById("loading");

    function preLoader() {
        preloader.style.display = 'none';
    };
    preLoader()

    const addClass = () => {
        // const inputClassName = document.getElementById("inputClassName").value

        Classname = inputClassName.value
        const found = classes.some(el => el.name === Classname);
        if (!found) {
            identity += 1
            classes.push({ id: identity, name: Classname, count: 0 });
        }


        trainingCards.innerHTML += '<div class="newshifter"><div class="text-center"><h3>Class Name : <span>' + Classname + '</span></h3><h3>Images : <span id = "images-' + identity + '" >0</span></h3></div ><div><button class="dark btn-spread btn-shadow mr-5" id="' + identity + '">Add New Images <i class="fas fa-plus fa-1x"></i></button></div></div>'

        window.scrollTo(0, document.body.scrollHeight);

        document.getElementById(identity.toString()).addEventListener('click', () => addDatasetClass(identity));
        inputClassName.value = ""

        //    console.log(classes)
    }


    const initializeElements = () => {
        const inputClassName = document.getElementById("inputClassName").value
        document.getElementById('add-button').addEventListener('click', () => addClass(inputClassName));
        // document.getElementById('btnSpeak').addEventListener('click', () => speak());
        document.getElementById('load_button').addEventListener('change', (event) => uploadModel(knnClassifierModel, event));
        document.getElementById('save_button').addEventListener('click', async () => downloadModel(knnClassifierModel));


    };

    const saveClassifier = (classifierModel) => {
        let datasets = classifierModel.getClassifierDataset();
        let datasetObject = {};
        let i = 0;
        Object.keys(datasets).forEach((key) => {
            let data = datasets[key].dataSync();
            datasetObject[classes[i].name] = Array.from(data);
            i += 1
        });
        let jsonModel = JSON.stringify(datasetObject);
        //    console.log(jsonModel);

        let downloader = document.createElement('a');
        downloader.download = "model.json";
        downloader.href = 'data:text/text;charset=utf-8,' + encodeURIComponent(jsonModel);
        document.body.appendChild(downloader);
        downloader.click();
        downloader.remove();
    };


    const uploadModel = async (classifierModel, event) => {
        uploadedModel = true;
        let inputModel = event.target.files;
        console.log("Uploading");
        let fr = new FileReader();
        if (inputModel.length > 0) {
            fr.onload = async () => {
                var dataset = fr.result;
                var tensorObj = JSON.parse(dataset);

                Object.keys(tensorObj).forEach((key) => {
                    tensorObj[key] = tf.tensor(tensorObj[key], [tensorObj[key].length / 1024, 1024]);
                    identity += 1;
                    classes.push({ id: identity, name: key, count: 0 });
                });

                classifierModel.setClassifierDataset(tensorObj);
                console.log("Classifier has been set up! Congrats! ");
            };
        }
        await fr.readAsText(inputModel[0]);
        console.log("Uploaded");
        //    console.log(classes)
    };



    const downloadModel = async (classifierModel) => {
        saveClassifier(classifierModel);
    };



    const addDatasetClass = async (classId) => {

        // Capture an image from the web camera.
        const img = await webcamInput.capture();


        const activation = mobilenetModel.infer(img, 'conv_preds');

        // Pass the intermediate activation to the classifier.
        knnClassifierModel.addExample(activation, classId);

        let classIndex = classes.findIndex(el => el.id === classId)
        currentCount = classes[classIndex].count
        currentCount += 1
        classes[classIndex].count = currentCount

        var temp_id = 'images-' + classId.toString()
        document.getElementById(temp_id).innerHTML = currentCount;

        // Dispose the tensor to release the memory.
        img.dispose();
    };



    // const imageClassificationWithTransferLearningOnWebcam = async() => {
    //     console.log("Machine Learning on the web is ready");
    //     while (true) {
    //         if (knnClassifierModel.getNumClasses() > 0) {
    //             const img = await webcamInput.capture();

    //             // Get the activation from mobilenet from the webcam.
    //             const activation = mobilenetModel.infer(img, 'conv_preds');
    //             // Get the most likely class and confidences from the classifier module.
    //             const result = await knnClassifierModel.predictClass(activation);

    //             if (uploadedModel) {
    //                 predictions.innerHTML = result.label
    //                 confidence.innerHTML = Math.floor(result.confidences[result.label] * 100)

    //             } else {

    //                 try {
    //                     predictions.innerHTML = classes[result.label - 1].name
    //                     confidence.innerHTML = Math.floor(result.confidences[result.label] * 100)
    //                 } catch (err) {
    //                     predictions.innerHTML = result.label - 1
    //                     confidence.innerHTML = Math.floor(result.confidences[result.label] * 100)
    //                 }
    //             }


    //             // Dispose the tensor to release the memory.
    //             img.dispose();
    //         }
    //         await tf.nextFrame();
    //     }
    // };

    // const imageClassificationWithTransferLearningOnWebcam = async () => {
    //     console.log("Machine Learning on the web is ready");

    //     while (true) {
    //         if (knnClassifierModel.getNumClasses() > 0) {
    //             const img = await webcamInput.capture();
    //             const activation = mobilenetModel.infer(img, 'conv_preds');
    //             const result = await knnClassifierModel.predictClass(activation);
    /////////////////////////////////////////////////////////old////////////////////////

    // let confidenceThreshold = 0.1; // Adjust this to improve accuracy
    // let bestConfidence = Math.max(...Object.values(result.confidences)); // Get highest confidence score

    // if (bestConfidence < confidenceThreshold) {
    //     // If confidence is too low, classify as "Unknown Sign"
    //     predictions.innerHTML = "Unknown Sign";
    //     confidence.innerHTML = Math.floor(bestConfidence * 100);
    // } else {
    //     // Only classify if confidence is high
    //     if (uploadedModel) {
    //         predictions.innerHTML = result.label;
    //         confidence.innerHTML = Math.floor(bestConfidence * 100);
    //     } else {
    //         try {
    //             predictions.innerHTML = classes[result.label - 1].name;
    //             confidence.innerHTML = Math.floor(bestConfidence * 100);
    //         } catch (err) {
    //             predictions.innerHTML = "Unknown Sign"; // Fallback for errors
    //             confidence.innerHTML = Math.floor(bestConfidence * 100);
    //         }
    //     }
    // }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    //             let confidenceThreshold = 0.9; // You can tune this (0.5 = 50% confidence)
    //             let bestConfidence = Math.max(...Object.values(result.confidences));

    //             if (bestConfidence < confidenceThreshold) {
    //                 predictions.innerHTML = "Not Detected";
    //                 confidence.innerHTML = Math.floor(bestConfidence * 100);
    //             } else {
    //                 try {
    //                     let labelName;
    //                     if (uploadedModel) {
    //                         labelName = result.label;
    //                     } else {
    //                         const classItem = classes.find(c => c.id === parseInt(result.label));
    //                         labelName = classItem ? classItem.name : "Not Detected";
    //                     }

    //                     predictions.innerHTML = labelName;
    //                     confidence.innerHTML = Math.floor(bestConfidence * 100);
    //                 } catch (err) {
    //                     predictions.innerHTML = "Not Detected";
    //                     confidence.innerHTML = Math.floor(bestConfidence * 100);
    //                 }
    //             }


    //             img.dispose(); // Free memory
    //         }
    //         await tf.nextFrame();
    //     }
    // };

    const imageClassificationWithTransferLearningOnWebcam = async () => {
        console.log("Machine Learning on the web is ready");
        let lastSpoken = "";
        let storedText = [];

        while (true) {
            if (knnClassifierModel.getNumClasses() > 0) {
                const img = await webcamInput.capture();
                const activation = mobilenetModel.infer(img, 'conv_preds');
                const result = await knnClassifierModel.predictClass(activation);
                let confidenceThreshold = 1.0;
                let bestConfidence = Math.max(...Object.values(result.confidences));
                let labelName = "Not Found";

                if (bestConfidence >= confidenceThreshold) {
                    try {
                        if (uploadedModel) {
                            labelName = result.label;

                        } else {
                            const classItem = classes.find(c => c.id === parseInt(result.label));
                            labelName = classItem ? classItem.name : "Not Found";
                        }
                    } catch (err) {
                        labelName = "Not Found";
                    }
                }

                predictions.innerHTML = labelName;
                confidence.innerHTML = Math.floor(bestConfidence * 100);

                const isTrainedClass = classes.some(c => c.name === labelName);

                // ✅ Speak every label, including "Not Detected", if different from last spoken
                if (labelName !== lastSpoken) {
                    let msg = new SpeechSynthesisUtterance(labelName);
                    window.speechSynthesis.cancel();
                    window.speechSynthesis.speak(msg);

                    msg.onend = () => {
                        if (
                            labelName !== "Unknown Sign" &&
                            isTrainedClass &&
                            storedText[storedText.length - 1] !== labelName
                        ) {
                            storedText.push(labelName);
                            updateStoredWordsDisplay(storedText);
                        }
                    };

                    lastSpoken = labelName;
                }

                img.dispose();
            }

            await tf.nextFrame();
        }
    };






    var btnSpeak = document.querySelector('#btnSpeak');

    btnSpeak.addEventListener('click', () => {
        var msg = new SpeechSynthesisUtterance();
        msg.text = predictions.innerHTML;
        window.speechSynthesis.speak(msg);
    });



    await initializeElements();
    await imageClassificationWithTransferLearningOnWebcam();
};

window.onload = () => {
    start();
};