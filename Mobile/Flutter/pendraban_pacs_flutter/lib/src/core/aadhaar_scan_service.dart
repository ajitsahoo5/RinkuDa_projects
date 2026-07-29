import 'package:flutter/services.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:image_picker/image_picker.dart';

import 'aadhaar_ocr_parser.dart';

/// Thrown when the user denies camera access for Aadhaar scan.
class CameraAccessDeniedException implements Exception {}

/// Captures an Aadhaar image and extracts name / number via on-device OCR.
class AadhaarScanService {
  AadhaarScanService({ImagePicker? picker}) : _picker = picker ?? ImagePicker();

  final ImagePicker _picker;

  Future<AadhaarOcrParseResult?> scanFromCamera() async {
    final XFile? file;
    try {
      file = await _picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 88,
        preferredCameraDevice: CameraDevice.rear,
      );
    } on PlatformException catch (e) {
      if (e.code == 'camera_access_denied' ||
          e.code == 'camera_access_restricted') {
        throw CameraAccessDeniedException();
      }
      rethrow;
    }
    if (file == null) return null;

    final recognizer = TextRecognizer(script: TextRecognitionScript.latin);
    try {
      final inputImage = InputImage.fromFilePath(file.path);
      final recognizedText = await recognizer.processImage(inputImage);
      return parseAadhaarOcrText(recognizedText.text);
    } finally {
      await recognizer.close();
    }
  }
}

