import 'dart:ui';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:excel/excel.dart';
import 'package:path_provider/path_provider.dart';
import 'package:open_file/open_file.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark(),
      home: const DashboardPage(),
    );
  }
}

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  final ScrollController _tableScrollController = ScrollController();

  int currentPage = 0;

  String searchQuery = "";
  String selectedType = "All";

  final List<Map<String, dynamic>> farmers = List.generate(
    50,
    (index) => {
      "name": "Farmer ${index + 1}",
      "address": "Village ${index + 1}",
      "loan": (10000 + index * 500),
      "type": index % 2 == 0 ? "Rabi" : "Kharif",
      "date": "2026-04-${(index % 30) + 1}",
    },
  );

  @override
  Widget build(BuildContext context) {
    final isDesktop = MediaQuery.of(context).size.width > 900;

    final filteredFarmers = farmers.where((f) {
      final matchesSearch = f["name"].toLowerCase().contains(
        searchQuery.toLowerCase(),
      );
      final matchesType = selectedType == "All" || f["type"] == selectedType;
      return matchesSearch && matchesType;
    }).toList();

    double screenHeight = MediaQuery.of(context).size.height;
    int rowsPerPage = ((screenHeight - 300) / 55).floor();
    rowsPerPage = rowsPerPage.clamp(5, 50);

    int start = currentPage * rowsPerPage;
    int end = (start + rowsPerPage).clamp(0, filteredFarmers.length);

    final paginatedData = filteredFarmers.sublist(start, end);

    return Scaffold(
      drawer: isDesktop ? null : Drawer(child: _buildSidebar()),

      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF6A11CB), Color(0xFF2575FC)],
          ),
        ),
        child: Row(
          children: [
            if (isDesktop) _buildSidebar(),

            Expanded(
              child: Column(
                children: [
                  _buildHeader(isDesktop),

                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          _buildSearchBar(filteredFarmers),

                          const SizedBox(height: 15),

                          Expanded(child: _buildTable(paginatedData, start)),

                          _buildPagination(end, filteredFarmers.length),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // HEADER
  Widget _buildHeader(bool isDesktop) {
    return Container(
      padding: const EdgeInsets.only(top: 50, left: 16, right: 16, bottom: 20),
      child: Row(
        children: [
          if (!isDesktop)
            Builder(
              builder: (context) => IconButton(
                icon: const Icon(Icons.menu, color: Colors.white),
                onPressed: () => Scaffold.of(context).openDrawer(),
              ),
            ),
          const Text(
            "Farmer Dashboard",
            style: TextStyle(color: Colors.white, fontSize: 22),
          ),
          const Spacer(),
          IconButton(onPressed: () {}, icon: Icon(Icons.person)),
          IconButton(onPressed: () {}, icon: Icon(Icons.logout)),
        ],
      ),
    );
  }

  // SIDEBAR
  Widget _buildSidebar() {
    return Container(
      width: 250,
      padding: const EdgeInsets.symmetric(vertical: 20),
      color: Colors.black.withOpacity(0.2),
      child: Column(
        children: [
          CircleAvatar(
            radius: 40,
            backgroundColor: Colors.white.withOpacity(0.2),
            child: const Icon(Icons.agriculture, size: 40, color: Colors.white),
          ),
          const SizedBox(height: 10),
          const Text("Farmer App", style: TextStyle(color: Colors.white)),

          const SizedBox(height: 30),

          ListTile(
            leading: Icon(Icons.dashboard, color: Colors.white),
            title: Text("Dashboard", style: TextStyle(color: Colors.white)),
          ),

          ListTile(
            leading: Icon(Icons.add, color: Colors.white),
            title: Text("Add Farmer", style: TextStyle(color: Colors.white)),
            onTap: () => _showDialog(),
          ),

          const Spacer(),

          const Padding(
            padding: EdgeInsets.all(10),
            child: Text(
              "Version 1.0.0",
              style: TextStyle(color: Colors.white70),
            ),
          ),
        ],
      ),
    );
  }

  // SEARCH + FILTER + EXPORT
  Widget _buildSearchBar(List filteredFarmers) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            SizedBox(
              width: 300,
              child: TextField(
                decoration: InputDecoration(
                  hintText: "Search farmer...",
                  filled: true,
                  fillColor: Colors.white.withOpacity(0.1),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                ),
                onChanged: (v) => setState(() {
                  searchQuery = v;
                  currentPage = 0;
                }),
              ),
            ),
            const SizedBox(width: 30),
            SizedBox(
              width: 220,
              child: DropdownMenu<String>(
                initialSelection: selectedType,
                onSelected: (v) => setState(() => selectedType = v ?? "All"),
                dropdownMenuEntries: const [
                  DropdownMenuEntry(value: "All", label: "All"),
                  DropdownMenuEntry(value: "Rabi", label: "Rabi"),
                  DropdownMenuEntry(value: "Kharif", label: "Kharif"),
                ],
              ),
            ),
          ],
        ),

        const SizedBox(width: 20),

        ElevatedButton.icon(
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
            backgroundColor: Colors.green,
          ),
          onPressed: () => _exportToExcel(filteredFarmers),
          icon: const Icon(Icons.table_chart),
          label: const Text("Export"),
        ),
      ],
    );
  }

  @override
  void dispose() {
    _tableScrollController.dispose();
    super.dispose();
  }

  // TABLE
  Widget _buildTable(List data, int start) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return Scrollbar(
          controller: _tableScrollController,
          thumbVisibility: true,
          trackVisibility: true,
          child: SingleChildScrollView(
            controller: _tableScrollController,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: ConstrainedBox(
                constraints: BoxConstraints(minWidth: constraints.maxWidth),
                child: DataTable(
                  dataRowMinHeight: 40,
                  dataRowMaxHeight: 55,
                  columnSpacing: constraints.maxWidth > 1000 ? 30 : 15,

                  // 🔥 ADD THIS (IMPORTANT)
                  headingTextStyle: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                  dataTextStyle: const TextStyle(color: Colors.white),

                  // Optional: header background
                  headingRowColor: MaterialStateProperty.all(
                    Colors.white.withOpacity(0.1),
                  ),

                  columns: _buildColumns(constraints.maxWidth),

                  rows: List.generate(data.length, (i) {
                    final d = data[i];

                    return DataRow(
                      cells: [
                        DataCell(Text("${start + i + 1}")),
                        DataCell(Text(d["name"])),

                        if (constraints.maxWidth > 600)
                          DataCell(Text(d["address"])),

                        DataCell(Text("₹${d["loan"]}")),

                        if (constraints.maxWidth > 700)
                          DataCell(Text(d["type"])),

                        if (constraints.maxWidth > 900)
                          DataCell(Text(d["date"])),

                        DataCell(
                          Row(
                            children: [
                              IconButton(
                                icon: const Icon(
                                  Icons.edit,
                                  color: Colors.white70,
                                ),
                                onPressed: () => _showDialog(farmer: d),
                              ),
                              IconButton(
                                icon: const Icon(
                                  Icons.delete,
                                  color: Colors.red,
                                ),
                                onPressed: () =>
                                    setState(() => farmers.remove(d)),
                              ),
                            ],
                          ),
                        ),
                      ],
                    );
                  }),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  List<DataColumn> _buildColumns(double width) {
    return [
      const DataColumn(label: Text("SL")),
      const DataColumn(label: Text("Name")),
      if (width > 600) const DataColumn(label: Text("Address")),
      const DataColumn(label: Text("Loan")),
      if (width > 700) const DataColumn(label: Text("Type")),
      if (width > 900) const DataColumn(label: Text("Date")),
      const DataColumn(label: Text("Action")),
    ];
  }

  // PAGINATION
  Widget _buildPagination(int end, int total) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        ElevatedButton(
          onPressed: currentPage > 0
              ? () => setState(() => currentPage--)
              : null,
          child: Text("Prev"),
        ),
        const SizedBox(width: 20),
        Text("Page ${currentPage + 1}", style: TextStyle(color: Colors.white)),
        const SizedBox(width: 20),
        ElevatedButton(
          onPressed: end < total ? () => setState(() => currentPage++) : null,
          child: Text("Next"),
        ),
      ],
    );
  }

  // ADD / EDIT
  void _showDialog({Map<String, dynamic>? farmer}) {
    final name = TextEditingController(text: farmer?["name"]);
    final address = TextEditingController(text: farmer?["address"]);

    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(farmer == null ? "Add Farmer" : "Edit Farmer"),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: name),
            TextField(controller: address),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              setState(() {
                if (farmer == null) {
                  farmers.add({
                    "name": name.text,
                    "address": address.text,
                    "loan": 10000,
                    "type": "Rabi",
                    "date": "2026-04-01",
                  });
                } else {
                  farmer["name"] = name.text;
                  farmer["address"] = address.text;
                }
              });
              Navigator.pop(context);
            },
            child: Text("Save"),
          ),
        ],
      ),
    );
  }

  // EXPORT EXCEL
  Future<void> _exportToExcel(List data) async {
    final excel = Excel.createExcel();
    final sheet = excel['Farmers'];

    sheet.appendRow(["Name", "Address", "Loan", "Type", "Date"]);

    for (var f in data) {
      sheet.appendRow([
        f["name"],
        f["address"],
        f["loan"],
        f["type"],
        f["date"],
      ]);
    }

    final dir = await getApplicationDocumentsDirectory();
    final path =
        "${dir.path}/farmers_${DateTime.now().millisecondsSinceEpoch}.xlsx";

    File(path)
      ..createSync(recursive: true)
      ..writeAsBytesSync(excel.save()!);

    await OpenFile.open(path);
  }
}
