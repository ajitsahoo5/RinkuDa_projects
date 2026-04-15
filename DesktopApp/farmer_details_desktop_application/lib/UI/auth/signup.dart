import 'package:farmer_details_desktop_application/ui_components/auth_background.dart';
import 'package:farmer_details_desktop_application/ui_components/avatar.dart';
import 'package:farmer_details_desktop_application/ui_components/button.dart';
import 'package:farmer_details_desktop_application/ui_components/glasscard.dart';
import 'package:farmer_details_desktop_application/ui_components/input_field.dart';
import 'package:flutter/material.dart';

class SignupPage extends StatelessWidget {
  const SignupPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: background(
        child: glassCard(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              avatar(),

              const SizedBox(height: 30),

              inputField("Full Name", Icons.person),
              const SizedBox(height: 20),

              inputField("Email ID", Icons.email),
              const SizedBox(height: 20),

              inputField("Password", Icons.lock, isPassword: true),
              const SizedBox(height: 20),

              inputField("Confirm Password", Icons.lock_outline,
                  isPassword: true),

              const SizedBox(height: 25),

              button("SIGN UP"),

              const SizedBox(height: 20),

              // Back to Login
              GestureDetector(
                onTap: () {
                  Navigator.pop(context);
                },
                child: const Text(
                  "Already have an account? Login",
                  style: TextStyle(color: Colors.white70),
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}