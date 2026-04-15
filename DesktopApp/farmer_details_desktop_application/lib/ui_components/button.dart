import 'package:flutter/material.dart';

Widget button(String text, {VoidCallback? onPressed}) {
  return InkWell(
    onTap: onPressed,
    child: Container(
      width: double.infinity,
      height: 50,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(25),
        gradient: const LinearGradient(
          colors: [
            Color(0xFFFF416C),
            Color(0xFF4A00E0),
          ],
        ),
      ),
      child: Center(
        child: Text(
          text,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            letterSpacing: 1,
          ),
        ),
      ),
    ),
  );
}