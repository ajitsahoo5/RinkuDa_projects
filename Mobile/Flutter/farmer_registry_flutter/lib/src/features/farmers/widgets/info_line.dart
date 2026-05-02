import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

class InfoLine extends StatelessWidget {
  const InfoLine({
    super.key,
    required this.label,
    required this.value,
    this.icon,
    this.isHighlighted = false,
  });

  final String label;
  final String value;
  final IconData? icon;
  final bool isHighlighted;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context).textTheme;
    final content = Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (icon != null)
          Padding(
            padding: const EdgeInsets.only(top: 2),
            child: PhosphorIcon(
              icon!, 
              size: 17, 
              color: isHighlighted 
                  ? Colors.white.withValues(alpha: 0.9)
                  : Colors.black.withValues(alpha: 0.55),
            ),
          ),
        if (icon != null) const SizedBox(width: 8),
        Expanded(
          child: RichText(
            text: TextSpan(
              style: t.bodyMedium?.copyWith(
                color: isHighlighted 
                    ? Colors.white 
                    : const Color(0xFF0F172A),
              ),
              children: [
                TextSpan(
                  text: '$label  ',
                  style: t.bodySmall?.copyWith(
                    color: isHighlighted 
                        ? Colors.white.withValues(alpha: 0.8)
                        : Colors.black.withValues(alpha: 0.55),
                    fontWeight: FontWeight.w600,
                  ),
                ),
                TextSpan(
                  text: value.isEmpty ? '—' : value,
                  style: t.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: isHighlighted ? Colors.white : null,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );

    if (isHighlighted) {
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Theme.of(context).primaryColor,
              Theme.of(context).primaryColor.withValues(alpha: 0.8),
            ],
          ),
          borderRadius: BorderRadius.circular(8),
        ),
        child: content,
      );
    }

    return content;
  }
}

