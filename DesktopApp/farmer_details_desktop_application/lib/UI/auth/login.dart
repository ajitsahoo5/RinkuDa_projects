import 'dart:ui';

import 'package:farmer_details_desktop_application/UI/auth/signup.dart';
import 'package:farmer_details_desktop_application/UI/home/dashboard.dart';
import 'package:farmer_details_desktop_application/ui_components/auth_background.dart';
import 'package:farmer_details_desktop_application/ui_components/avatar.dart';
import 'package:farmer_details_desktop_application/ui_components/button.dart';
import 'package:farmer_details_desktop_application/ui_components/glasscard.dart';
import 'package:farmer_details_desktop_application/ui_components/input_field.dart';
import 'package:flutter/material.dart';

class LoginPage extends StatelessWidget {
  const LoginPage({super.key});

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

              inputField("Email ID", Icons.email),
              const SizedBox(height: 20),
              inputField("Password", Icons.lock, isPassword: true),

              const SizedBox(height: 15),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: const [
                      Checkbox(value: true, onChanged: null),
                      Text("Remember me",
                          style: TextStyle(color: Colors.white70, fontSize: 12)),
                    ],
                  ),
                  const Text("Forgot Password?",
                      style: TextStyle(color: Colors.white70, fontSize: 12)),
                ],
              ),

              const SizedBox(height: 25),

              button("LOGIN", onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (context) => const DashboardPage()),
                );
              }),

              const SizedBox(height: 20),

              // Navigate to Signup
              GestureDetector(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (context) => const SignupPage()),
                  );
                },
                child: const Text(
                  "Don't have an account? Sign up",
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