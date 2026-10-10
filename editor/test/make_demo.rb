#!/usr/bin/env ruby
# frozen_string_literal: true
# Produces synthetic media only. Does not access an installed BBB server.
require_relative '../lib/recording_editor'
root = ARGV.fetch(0) { abort 'Usage: ruby editor/test/make_demo.rb /tmp/bbb-editor-demo' }
root = File.expand_path(root)
id = "#{'d' * 40}-#{(Time.now.to_f * 1000).to_i - 1000}"
raw = File.join(root, 'raw', id)
FileUtils.mkdir_p(%w[audio video deskshare presentation/deck/svgs].map { |dir| File.join(raw, dir) })
origin = 8_000_000_000
utc = Time.now.to_i * 1000
xml = Nokogiri::XML('<recording bbb_version="4.0.0"><metadata meetingName="録画編集デモ：プロジェクト定例会"/></recording>')
def event(xml, origin, utc, ms, mod, name, fields = {})
  e = Nokogiri::XML::Node.new('event', xml)
  e['timestamp'], e['module'], e['eventname'] = (origin + ms).to_s, mod, name
  { 'timestampUTC' => utc + ms, **fields }.each do |key, value|
    child = Nokogiri::XML::Node.new(key, xml); child.content = value.to_s; e.add_child(child)
  end
  xml.root.add_child(e)
end
event(xml, origin, utc, 0, 'PARTICIPANT', 'ParticipantJoinEvent', 'userId' => 'admin', 'name' => '管理者')
event(xml, origin, utc, 0, 'VOICE', 'StartRecordingEvent', 'filename' => 'microphone.wav')
event(xml, origin, utc, 0, 'PRESENTATION', 'SharePresentationEvent', 'presentationName' => 'deck')
event(xml, origin, utc, 0, 'PRESENTATION', 'GotoSlideEvent', 'slide' => 0)
event(xml, origin, utc, 1000, 'PARTICIPANT', 'RecordStatusEvent', 'status' => 'true', 'userId' => 'admin')
event(xml, origin, utc, 3000, 'bbb-webrtc-sfu', 'StartWebRTCShareEvent', 'filename' => 'camera.mp4', 'userId' => '担当者')
event(xml, origin, utc, 6000, 'CHAT', 'PublicChatEvent', 'sender' => '担当者', 'message' => 'ここから議題1です。')
shape = { id: 'shape:demo', type: 'geo', x: 90, y: 340, rotation: 0, isLocked: false, opacity: 1, meta: {}, index: 'a2', typeName: 'shape', parentId: 'page:deck', props: { w: 430, h: 140, geo: 'rectangle', color: 'red', labelColor: 'black', fill: 'none', dash: 'draw', size: 'm', font: 'draw', text: '', align: 'middle', verticalAlign: 'middle', growY: 0, url: '' } }
event(xml, origin, utc, 8000, 'PRESENTATION', 'AddTldrawShapeEvent', 'presentation' => 'deck', 'pageNumber' => 0, 'shapeId' => 'shape:demo', 'shapeData' => JSON.generate(shape))
event(xml, origin, utc, 14000, 'PRESENTATION', 'GotoSlideEvent', 'slide' => 1)
event(xml, origin, utc, 20000, 'bbb-webrtc-sfu', 'StartWebRTCDesktopShareEvent', 'filename' => 'screen.mp4')
event(xml, origin, utc, 27000, 'CHAT', 'PublicChatEvent', 'sender' => '管理者', 'message' => 'この部分の音声をピー音に置き換えます。')
event(xml, origin, utc, 34000, 'bbb-webrtc-sfu', 'StopWebRTCDesktopShareEvent', 'filename' => 'screen.mp4')
event(xml, origin, utc, 39000, 'PARTICIPANT', 'RecordStatusEvent', 'status' => 'false', 'userId' => 'admin')
event(xml, origin, utc, 44000, 'bbb-webrtc-sfu', 'StopWebRTCShareEvent', 'filename' => 'camera.mp4')
event(xml, origin, utc, 44000, 'PARTICIPANT', 'RecordStatusEvent', 'status' => 'true', 'userId' => 'admin')
event(xml, origin, utc, 57000, 'PARTICIPANT', 'RecordStatusEvent', 'status' => 'false', 'userId' => 'admin')
event(xml, origin, utc, 60000, 'VOICE', 'StopRecordingEvent', 'filename' => 'microphone.wav')
event(xml, origin, utc, 60000, 'MEETING', 'EndAndKickAllEvent')
File.write(File.join(raw, 'events.xml'), xml.to_xml)
[['議題1', '録画区間を編集する', '会議全体の時間軸で指定'], ['議題2', '音声だけをピー音へ', '画面共有の音声も対象']].each_with_index do |(title, line1, line2), index|
  File.write(File.join(raw, 'presentation', 'deck', 'svgs', "slide#{index + 1}.svg"), <<~SVG)
    <svg xmlns="http://www.w3.org/2000/svg" width="1440" height="1080" viewBox="0 0 1440 1080">
      <rect width="1440" height="1080" fill="#f5f7fa"/><rect width="1440" height="20" fill="#2478ad"/>
      <text x="90" y="190" font-size="48" fill="#2478ad" font-family="sans-serif">#{title}</text>
      <text x="90" y="320" font-size="62" fill="#182d42" font-family="sans-serif">#{line1}</text>
      <text x="110" y="430" font-size="38" fill="#496274" font-family="sans-serif">#{line2}</text>
      <text x="90" y="950" font-size="26" fill="#72899c" font-family="sans-serif">BBB Recording Editor · Synthetic demo</text>
    </svg>
  SVG
end
RecordingEditor.run('ffmpeg', '-nostdin', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=60', '-af', 'volume=0.7+0.3*sin(2*PI*t/5):eval=frame', File.join(raw, 'audio', 'microphone.wav'))
RecordingEditor.run('ffmpeg', '-nostdin', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=s=320x180:r=10:d=41', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', File.join(raw, 'video', 'camera.mp4'))
RecordingEditor.run('ffmpeg', '-nostdin', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=s=640x360:r=10:d=14', '-f', 'lavfi', '-i', 'sine=frequency=880:duration=14', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', File.join(raw, 'deskshare', 'screen.mp4'))
puts JSON.pretty_generate(root: root, id: id, raw_root: File.join(root, 'raw'), state_root: File.join(root, 'state'))
