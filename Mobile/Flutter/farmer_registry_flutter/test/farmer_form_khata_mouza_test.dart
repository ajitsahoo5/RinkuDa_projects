import 'package:farmer_registry_flutter/src/features/farmers/widgets/farmer_form.dart';
import 'package:farmer_registry_flutter/src/models/farmer.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  Farmer existingFarmer() {
    return Farmer(
      id: 'existing-1',
      slNo: 7,
      dateOfPurchase: DateTime(2024),
      landOwnerName: 'Owner',
      villageOrMouza: 'Suliapada',
      khataNo: '42',
      area: 2,
      farmerName: 'Ramesh',
      aadharNo: '',
      mobileNo: '',
      cropsName: 'Paddy',
      fertilizers: const [],
      cscProducts: const [],
      seeds: const [],
      pesticides: const [],
      remarks: 'Cash',
    );
  }

  Future<void> enterFieldByLabel(
    WidgetTester tester,
    String label,
    String value,
  ) async {
    final decorator = find.byWidgetPredicate(
      (widget) =>
          widget is InputDecorator &&
          widget.decoration.labelText?.startsWith(label) == true,
    );
    expect(decorator, findsOneWidget);
    await tester.ensureVisible(decorator);
    final editable = find.descendant(
      of: decorator,
      matching: find.byType(EditableText),
    );
    await tester.enterText(editable, value);
    await tester.pump();
  }

  testWidgets('shows duplicate Khata+Mouza error while typing', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SingleChildScrollView(
            child: FarmerForm(
              mode: FarmerFormMode.create,
              fertilizerDefinitions: const [],
              existingFarmers: [existingFarmer()],
              nextSlNumber: 8,
              onSubmit: (_) async {},
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await enterFieldByLabel(tester, 'Village/Mouza', 'Suliapada');
    await enterFieldByLabel(tester, 'Khata No', '42');
    await tester.pumpAndSettle();

    expect(find.text('Duplicate Khata & Mouza'), findsOneWidget);
    expect(find.textContaining('Khata No "42" with Mouza "Suliapada"'), findsOneWidget);
    expect(find.text('Already registered (SL No 7)'), findsWidgets);
  });

  testWidgets('allows same khata when mouza differs', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SingleChildScrollView(
            child: FarmerForm(
              mode: FarmerFormMode.create,
              fertilizerDefinitions: const [],
              existingFarmers: [existingFarmer()],
              nextSlNumber: 8,
              onSubmit: (_) async {},
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await enterFieldByLabel(tester, 'Village/Mouza', 'Baripada');
    await enterFieldByLabel(tester, 'Khata No', '42');
    await tester.pump();

    expect(
      find.textContaining('Khata No and Mouza No combination is already registered'),
      findsNothing,
    );
    expect(find.text('Duplicate Khata & Mouza'), findsNothing);
  });
}
