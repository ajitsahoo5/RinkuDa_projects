import 'package:flutter/material.dart';

Widget avatar() {
  return Container(
    width: 80,
    height: 80,
    decoration: BoxDecoration(
      shape: BoxShape.circle,
      color: Colors.white.withOpacity(0.2),
    ),
    child: const Icon(Icons.person, size: 40, color: Colors.white),
  );
}
