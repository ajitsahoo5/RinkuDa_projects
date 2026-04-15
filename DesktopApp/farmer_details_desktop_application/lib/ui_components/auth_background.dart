import 'package:flutter/material.dart';

Widget background({required Widget child}) {
  return Container(
    decoration: const BoxDecoration(
      gradient: LinearGradient(
        colors: [
          Color(0xFF2c003e),
          Color(0xFF8e2de2),
          Color(0xFF4a00e0),
        ],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
    ),
    child: Center(child: child),
  );
}