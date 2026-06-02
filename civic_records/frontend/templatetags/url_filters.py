"""
Template helpers for building filter-toggle URLs without losing the rest
of the query string. Used by the topic-tag chip strip on the home page.
"""
from django import template
from django.http import QueryDict

register = template.Library()


@register.simple_tag(takes_context=True)
def toggle_param(context, key, value):
    """
    Return the current request URL with ?{key}={value} added if absent,
    or removed if already present. Multi-valued parameters supported —
    each chip is independently togglable.
    """
    request = context["request"]
    qd = request.GET.copy()
    values = qd.getlist(key)
    if value in values:
        values.remove(value)
    else:
        values.append(value)
    qd.setlist(key, values)
    qs = qd.urlencode()
    return f"{request.path}?{qs}" if qs else request.path


@register.simple_tag(takes_context=True)
def remove_param(context, key, value=None):
    """
    Return the current URL with ?{key} (or just key=value) removed.
    With no value, removes all values for the key.
    """
    request = context["request"]
    qd = request.GET.copy()
    if value is None:
        qd.pop(key, None)
    else:
        values = [v for v in qd.getlist(key) if v != value]
        qd.setlist(key, values)
    qs = qd.urlencode()
    return f"{request.path}?{qs}" if qs else request.path


@register.simple_tag(takes_context=True)
def clear_filters(context, *keep):
    """
    Return the URL with all filter params stripped, optionally preserving
    those named in `keep` (e.g., {% clear_filters 'q' %} preserves the
    search query while clearing facets).
    """
    request = context["request"]
    qd = QueryDict(mutable=True)
    for k in keep:
        if k in request.GET:
            qd.setlist(k, request.GET.getlist(k))
    qs = qd.urlencode()
    return f"{request.path}?{qs}" if qs else request.path
